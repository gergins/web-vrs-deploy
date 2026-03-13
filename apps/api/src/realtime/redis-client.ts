import { createClient } from "redis";
import { env } from "../config/env";

let redisClient = createClient({
  url: env.redisUrl
});
let connectionAttempted = false;

redisClient.on("error", (error) => {
  console.error("Redis client error", error);
});

export function getRedisClient() {
  return redisClient;
}

export async function connectRedis() {
  connectionAttempted = true;
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

export async function connectRedisSafely() {
  try {
    return await connectRedis();
  } catch (error) {
    console.warn(
      "Redis connection unavailable, continuing without Redis-backed realtime state",
      error
    );
    return null;
  }
}

export function isRedisAvailable() {
  return redisClient.isOpen;
}

export function hasAttemptedRedisConnection() {
  return connectionAttempted;
}
