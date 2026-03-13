type ApiEnv = {
  nodeEnv: string;
  apiPort: number;
  databaseUrl: string;
  redisUrl: string;
  corsOrigins: string[];
  jwtSecret: string;
  sessionCookieSecret: string;
  reconnectGraceMs: number;
  sessionHeartbeatIntervalMs: number;
  logLevel: string;
  turnHost: string;
  turnRealm: string;
  turnPort: number;
  turnTlsPort: number;
  turnSharedSecret: string;
  turnCredentialTtlSeconds: number;
};

function requireString(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requireNumber(name: string) {
  const raw = requireString(name);
  const value = Number(raw);

  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

function readNumber(name: string, defaultValue: number) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return defaultValue;
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

function requireStringList(name: string) {
  const value = requireString(name);
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error(`Environment variable ${name} must include at least one value`);
  }

  return items;
}

export const env: ApiEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: requireNumber("API_PORT"),
  databaseUrl: requireString("DATABASE_URL"),
  redisUrl: requireString("REDIS_URL"),
  corsOrigins: requireStringList("CORS_ORIGIN"),
  jwtSecret: requireString("JWT_SECRET"),
  sessionCookieSecret: requireString("SESSION_COOKIE_SECRET"),
  reconnectGraceMs: requireNumber("RECONNECT_GRACE_MS"),
  sessionHeartbeatIntervalMs: requireNumber("SESSION_HEARTBEAT_INTERVAL_MS"),
  turnHost: requireString("TURN_HOST"),
  turnRealm: requireString("TURN_REALM"),
  turnPort: requireNumber("TURN_PORT"),
  turnTlsPort: readNumber("TURN_TLS_PORT", 0),
  turnSharedSecret: requireString("TURN_SHARED_SECRET"),
  turnCredentialTtlSeconds: requireNumber("TURN_CREDENTIAL_TTL_SECONDS"),
  logLevel: process.env.LOG_LEVEL ?? "info"
};
