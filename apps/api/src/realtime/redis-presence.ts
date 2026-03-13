import { env } from "../config/env";
import {
  connectRedisSafely,
  getRedisClient,
  isRedisAvailable
} from "./redis-client";

function connectionKey(connectionId: string) {
  return `presence:connection:${connectionId}`;
}

function userKey(userId: string) {
  return `presence:user:${userId}`;
}

const ttlSeconds = Math.max(1, Math.ceil(env.reconnectGraceMs / 1000));

export async function touchConnectionPresence(connectionId: string, userId?: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return false;
  }

  const now = Date.now().toString();
  await client.set(connectionKey(connectionId), now, { EX: ttlSeconds });
  if (userId) {
    await client.set(userKey(userId), now, { EX: ttlSeconds });
  }

  return true;
}

export async function getLastSeenForConnection(connectionId: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return null;
  }

  const value = await client.get(connectionKey(connectionId));
  return value ? Number(value) : null;
}

export async function getLastSeenForUser(userId: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return null;
  }

  const value = await client.get(userKey(userId));
  return value ? Number(value) : null;
}

export async function clearConnectionPresence(connectionId: string) {
  const client = isRedisAvailable() ? getRedisClient() : await connectRedisSafely();
  if (!client) {
    return false;
  }

  await client.del(connectionKey(connectionId));
  return true;
}
