import { env } from "../config/env";
import {
  connectRedisSafely,
  getRedisClient,
  isRedisAvailable
} from "./redis-client";

function sessionMembershipKey(userId: string) {
  return `session-cache:user:${userId}`;
}

const ttlSeconds = Math.max(1, Math.ceil(env.reconnectGraceMs / 1000));

export async function cacheSessionMembership(userId: string, sessionIds: string[]) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return false;
  }

  await client.set(sessionMembershipKey(userId), JSON.stringify(sessionIds), {
    EX: ttlSeconds
  });

  return true;
}

export async function getCachedSessionMembership(userId: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return [];
  }

  const value = await client.get(sessionMembershipKey(userId));
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function clearCachedSessionMembership(userId: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return false;
  }

  await client.del(sessionMembershipKey(userId));
  return true;
}
