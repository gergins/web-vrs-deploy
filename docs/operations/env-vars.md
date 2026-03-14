# Environment Variables

This file documents the environment variables that are currently used by the repo runtime files.

## Core runtime

- `NODE_ENV`
  - used by API env parsing
- `API_PORT`
  - used by API startup
- `WEB_PORT`
  - used by local/container web runtime expectations

## Persistence and realtime

- `DATABASE_URL`
  - used by Prisma datasource
- `REDIS_URL`
  - used by the Redis client helper

## API security placeholders

- `JWT_SECRET`
  - required by API env validation
- `SESSION_COOKIE_SECRET`
  - required by API env validation

## Public application URLs

- `PUBLIC_APP_URL`
  - general documented app base URL
- `PUBLIC_API_BASE_URL`
  - general documented API base URL
- `PUBLIC_WS_URL`
  - general documented WebSocket URL

## Web client runtime

- `NEXT_PUBLIC_API_BASE_URL`
  - used by the Next.js web client for HTTP calls
- `NEXT_PUBLIC_WS_URL`
  - used by the Next.js web client for websocket signaling
- `NEXT_PUBLIC_STUN_URL`
  - reserved for browser ICE configuration
- `NEXT_PUBLIC_TURN_URL`
  - reserved for browser ICE configuration
- `NEXT_PUBLIC_TURN_USERNAME`
  - reserved for browser ICE configuration
- `NEXT_PUBLIC_TURN_PASSWORD`
  - reserved for browser ICE configuration

## TURN / CORS / timing

- `TURN_HOST`
- `TURN_REALM`
- `TURN_PORT`
- `TURN_TLS_PORT`
- `TURN_USERNAME`
- `TURN_PASSWORD`
- `CORS_ORIGIN`
- `LOG_LEVEL`
- `ROUTING_MODE`
- `SIMULTANEOUS_OFFER_FANOUT`
- `RECONNECT_GRACE_MS`
- `QUEUE_OFFER_TIMEOUT_MS`
- `SESSION_HEARTBEAT_INTERVAL_MS`

## Notes

- the API currently validates a server-side subset at startup
- `ROUTING_MODE` currently supports `sequential` and `simultaneous`
- `SIMULTANEOUS_OFFER_FANOUT` controls how many interpreters are targeted when `ROUTING_MODE=simultaneous`
- the web app currently needs `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL` for explicit browser configuration
- some documented variables exist for near-term runtime coherence even if the deeper feature that uses them is still scaffold-level
