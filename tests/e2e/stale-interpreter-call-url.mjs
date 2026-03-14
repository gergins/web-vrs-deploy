import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { WebSocket } from "ws";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SIGNER_PORT = 9262;
const INTERPRETER_ONE_PORT = 9263;
const INTERPRETER_TWO_PORT = 9264;
const BASE_URL = "http://localhost:3000";
const API_BASE_URL = "http://localhost:3001";

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

async function getInterpreterActiveSession(userId) {
  const response = await fetch(`${API_BASE_URL}/interpreters/active-session`, {
    headers: {
      "x-user-id": userId
    }
  });

  if (!response.ok) {
    throw new Error(`Failed active-session lookup for ${userId}: ${response.status}`);
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

  async setSelectValueByTestId(testId, value) {
    const updated = await this.evaluate(`
      (() => {
        const element = document.querySelector('[data-testid="${testId}"]');
        if (!(element instanceof HTMLSelectElement)) return false;
        element.value = ${JSON.stringify(value)};
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return element.value;
      })()
    `);

    if (updated !== value) {
      throw new Error(`Failed to set ${testId} to ${value}`);
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

  async waitForBodyTextIncludes(expectedSubstring, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = await this.evaluate("document.body.innerText");
      if (typeof text === "string" && text.includes(expectedSubstring)) {
        return text;
      }
      await delay(250);
    }

    throw new Error(`Timed out waiting for body to include ${expectedSubstring}`);
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

  async waitForUrlExcludes(fragment, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const href = await this.evaluate("window.location.href");
      if (typeof href === "string" && !href.includes(fragment)) {
        return href;
      }
      await delay(250);
    }

    throw new Error(`Timed out waiting for URL excluding ${fragment}`);
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
  const interpreterOne = await launchBrowser(INTERPRETER_ONE_PORT);
  const interpreterTwo = await launchBrowser(INTERPRETER_TWO_PORT);

  try {
    await signer.navigate(`${BASE_URL}/queue`);
    await interpreterOne.navigate(`${BASE_URL}/interpreter`);

    await signer.clickByTestId("queue-authenticate");
    await interpreterOne.clickByTestId("interpreter-authenticate");

    await signer.waitForTextByTestId("queue-auth-state", "Authenticated");
    await interpreterOne.waitForTextByTestId("interpreter-auth-state", "Authenticated");

    await signer.clickByTestId("queue-create-call");
    await interpreterOne.waitForTextByTestId("interpreter-last-event", "assignment.offered");
    await interpreterOne.clickByTestId("interpreter-accept");

    const signerCallUrl = await signer.waitForUrlIncludes("/call/");
    const interpreterOneCallUrl = await interpreterOne.waitForUrlIncludes("/call/");
    const signerSessionId = extractSessionId(signerCallUrl);
    const interpreterOneSessionId = extractSessionId(interpreterOneCallUrl);

    if (!signerSessionId || !interpreterOneSessionId || signerSessionId !== interpreterOneSessionId) {
      throw new Error("Signer and interpreter-1 did not land on the same call session");
    }

    await signer.waitForTextByTestId("call-signaling-state", "Connected");
    await interpreterOne.waitForTextByTestId("call-signaling-state", "Connected");

    await interpreterTwo.navigate(`${BASE_URL}/call/${signerSessionId}?role=interpreter`);
    await interpreterTwo.waitForTextByTestId("call-authenticate", "Authenticate");
    await interpreterTwo.clickByTestId("call-authenticate");
    await interpreterTwo.waitForTextByTestId("call-auth-state", "Authenticated");

    await interpreterTwo.waitForUrlExcludes(`/call/${signerSessionId}`);
    await interpreterTwo.waitForUrlIncludes("/interpreter");
    await interpreterTwo.waitForBodyTextIncludes("Interpreter Workspace");
    await interpreterTwo.waitForTextByTestId("interpreter-auth-state", "Authenticated");
    await interpreterTwo.waitForTextByTestId("interpreter-identity", "user-interpreter-2");

    const interpreterTwoActiveSession = await getInterpreterActiveSession("user-interpreter-2");
    if (interpreterTwoActiveSession.activeSession) {
      throw new Error("Interpreter-2 should not gain an active session from a stale call URL");
    }

    console.log(
      JSON.stringify({
        ok: true,
        sessionId: signerSessionId
      })
    );
  } finally {
    await signer.close();
    await interpreterOne.close();
    await interpreterTwo.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
