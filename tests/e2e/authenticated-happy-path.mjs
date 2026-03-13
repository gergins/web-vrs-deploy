import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { WebSocket } from "ws";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SIGNER_PORT = 9222;
const INTERPRETER_PORT = 9223;
const BASE_URL = "http://localhost:3000";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed request ${url}: ${response.status}`);
  }
  return response.json();
}

class CdpPage {
  constructor(wsUrl, browserProcess, profileDir) {
    this.wsUrl = wsUrl;
    this.browserProcess = browserProcess;
    this.profileDir = profileDir;
    this.ws = null;
    this.nextId = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });

    this.ws.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (typeof message.id === "number" && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result ?? {});
        }
      }
    });

    await this.send("Runtime.enable");
    await this.send("Page.enable");
    await this.send("DOM.enable");
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await delay(1500);
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    return result.result?.value;
  }

  async clickByTestId(testId) {
    const clicked = await this.evaluate(`
      (() => {
        const element = document.querySelector('[data-testid="${testId}"]');
        if (!element) return false;
        element.click();
        return true;
      })()
    `);
    if (!clicked) {
      throw new Error(`Missing test id: ${testId}`);
    }
  }

  async getTextByTestId(testId) {
    return this.evaluate(`
      (() => {
        const element = document.querySelector('[data-testid="${testId}"]');
        return element ? element.textContent.trim() : null;
      })()
    `);
  }

  async waitForUrlIncludes(fragment, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const href = await this.evaluate("window.location.href");
      if (typeof href === "string" && href.includes(fragment)) {
        return href;
      }
      await delay(250);
    }
    throw new Error(`Timed out waiting for URL including ${fragment}`);
  }

  async waitForTextByTestId(testId, expectedSubstring, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = await this.getTextByTestId(testId);
      if (typeof text === "string" && text.includes(expectedSubstring)) {
        return text;
      }
      await delay(250);
    }
    throw new Error(`Timed out waiting for ${testId} to include ${expectedSubstring}`);
  }

  async waitForNoTextByTestId(testId, forbiddenSubstring, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = await this.getTextByTestId(testId);
      if (typeof text !== "string" || !text.includes(forbiddenSubstring)) {
        return;
      }
      await delay(250);
    }
    throw new Error(`Timed out waiting for ${testId} to exclude ${forbiddenSubstring}`);
  }

  async close() {
    try {
      this.ws?.close();
    } catch {}
    try {
      this.browserProcess.kill();
    } catch {}
    try {
      rmSync(this.profileDir, { recursive: true, force: true });
    } catch {}
  }
}

async function launchBrowser(debugPort) {
  const profileDir = mkdtempSync(join(tmpdir(), `web-vrs-e2e-${debugPort}-`));
  const browserProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "about:blank"
    ],
    {
      stdio: "ignore",
      detached: false
    }
  );

  const deadline = Date.now() + 15000;
  let wsUrl = null;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${debugPort}/json`);
      const pageTarget = targets.find((target) => target.type === "page");
      if (pageTarget?.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await delay(250);
  }

  if (!wsUrl) {
    try {
      browserProcess.kill();
    } catch {}
    throw new Error(`Failed to obtain CDP target on port ${debugPort}`);
  }

  const page = new CdpPage(wsUrl, browserProcess, profileDir);
  await page.connect();
  return page;
}

function extractSessionId(url) {
  const match = /\/call\/([^?]+)/.exec(url);
  return match?.[1] ?? null;
}

async function main() {
  const signer = await launchBrowser(SIGNER_PORT);
  const interpreter = await launchBrowser(INTERPRETER_PORT);

  try {
    await signer.navigate(`${BASE_URL}/queue`);
    await interpreter.navigate(`${BASE_URL}/interpreter`);

    await signer.clickByTestId("queue-authenticate");
    await interpreter.clickByTestId("interpreter-authenticate");

    await signer.waitForTextByTestId("queue-auth-state", "Authenticated");
    await interpreter.waitForTextByTestId("interpreter-auth-state", "Authenticated");

    await signer.navigate(`${BASE_URL}/queue`);
    await interpreter.navigate(`${BASE_URL}/interpreter`);

    await signer.waitForTextByTestId("queue-auth-state", "Authenticated");
    await interpreter.waitForTextByTestId("interpreter-auth-state", "Authenticated");

    await signer.clickByTestId("queue-create-call");
    await interpreter.waitForTextByTestId("interpreter-last-event", "assignment.offered");
    await interpreter.clickByTestId("interpreter-accept");

    const signerCallUrl = await signer.waitForUrlIncludes("/call/");
    const interpreterCallUrl = await interpreter.waitForUrlIncludes("/call/");
    const signerSessionId = extractSessionId(signerCallUrl);
    const interpreterSessionId = extractSessionId(interpreterCallUrl);

    if (!signerSessionId || !interpreterSessionId || signerSessionId !== interpreterSessionId) {
      throw new Error("Signer and interpreter did not land on the same call session");
    }

    await signer.waitForTextByTestId("call-auth-state", "Authenticated");
    await interpreter.waitForTextByTestId("call-auth-state", "Authenticated");
    await signer.waitForTextByTestId("call-role", "signer");
    await interpreter.waitForTextByTestId("call-role", "interpreter");
    await signer.waitForTextByTestId("call-session-id", signerSessionId);
    await interpreter.waitForTextByTestId("call-session-id", interpreterSessionId);
    await signer.waitForTextByTestId("call-signaling-state", "Connected");
    await interpreter.waitForTextByTestId("call-signaling-state", "Connected");
    await signer.waitForNoTextByTestId(
      "call-error",
      "Connection must authenticate before joining a session"
    );
    await interpreter.waitForNoTextByTestId(
      "call-error",
      "Connection must authenticate before joining a session"
    );

    console.log(JSON.stringify({
      ok: true,
      sessionId: signerSessionId
    }));
  } finally {
    await signer.close();
    await interpreter.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
