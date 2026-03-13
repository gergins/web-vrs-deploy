import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { loadLocalApiEnv } from "./local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const repoRoot = resolve(appRoot, "../..");
const envFile = resolve(repoRoot, ".env.example");
const schemaPath = resolve(appRoot, "src/db/prisma/schema.prisma");

loadLocalApiEnv(envFile);

const prismaCli = resolve(appRoot, "node_modules/prisma/build/index.js");
const args = process.argv.slice(2);
const hasSchemaArg = args.includes("--schema");
const child = spawn(
  process.execPath,
  hasSchemaArg ? [prismaCli, ...args] : [prismaCli, ...args, "--schema", schemaPath],
  {
    cwd: appRoot,
    env: process.env,
    stdio: "inherit"
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
