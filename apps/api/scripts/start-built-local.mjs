import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadLocalApiEnv } from "./local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const preferredEnvFile = resolve(repoRoot, ".env");
const fallbackEnvFile = resolve(repoRoot, ".env.example");

loadLocalApiEnv(preferredEnvFile, fallbackEnvFile);

await import(pathToFileURL(resolve(__dirname, "../dist/server.js")).href);
