import { readFileSync } from "node:fs";

function parseEnvFile(filepath) {
  const raw = readFileSync(filepath, "utf8");
  const parsed = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    parsed[key] = value;
  }

  return parsed;
}

function applyDefaults(envDefaults) {
  for (const [key, value] of Object.entries(envDefaults)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildLocalDatabaseUrl(template, postgresHostPort) {
  if (!template) {
    return null;
  }

  try {
    const url = new URL(template);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.port = postgresHostPort;
    }
    return url.toString();
  } catch {
    return template;
  }
}

function buildLocalRedisUrl(template, redisHostPort) {
  if (!template) {
    return null;
  }

  try {
    const url = new URL(template);
    if (url.hostname === "redis") {
      url.hostname = "localhost";
      url.port = redisHostPort;
    }
    return url.toString();
  } catch {
    return template;
  }
}

export function loadLocalApiEnv(envFile) {
  const envDefaults = parseEnvFile(envFile);
  applyDefaults(envDefaults);

  const postgresHostPort =
    process.env.POSTGRES_HOST_PORT ??
    envDefaults.POSTGRES_HOST_PORT ??
    "5433";
  const redisHostPort =
    process.env.REDIS_HOST_PORT ??
    envDefaults.REDIS_HOST_PORT ??
    "6379";
  const localDatabaseTemplate =
    envDefaults.LOCAL_DATABASE_URL ??
    process.env.LOCAL_DATABASE_URL ??
    process.env.DATABASE_URL;
  const redisTemplate =
    process.env.REDIS_URL ??
    envDefaults.REDIS_URL;
  const resolvedLocalDatabaseUrl = buildLocalDatabaseUrl(
    localDatabaseTemplate,
    postgresHostPort
  );
  const resolvedLocalRedisUrl = buildLocalRedisUrl(redisTemplate, redisHostPort);

  if (resolvedLocalDatabaseUrl) {
    process.env.LOCAL_DATABASE_URL = resolvedLocalDatabaseUrl;
    process.env.DATABASE_URL = resolvedLocalDatabaseUrl;
  }

  if (resolvedLocalRedisUrl) {
    process.env.REDIS_URL = resolvedLocalRedisUrl;
  }

  return {
    postgresHostPort,
    redisHostPort,
    databaseUrl: process.env.DATABASE_URL ?? null,
    redisUrl: process.env.REDIS_URL ?? null
  };
}
