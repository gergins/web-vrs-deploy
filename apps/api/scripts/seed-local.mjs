import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadLocalApiEnv } from "./local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const envFile = resolve(repoRoot, ".env.example");

loadLocalApiEnv(envFile);

await import(pathToFileURL(resolve(__dirname, "../dist/db/seed.js")).href);
