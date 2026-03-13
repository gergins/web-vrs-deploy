# Manual Test Checklist

## Authentication precheck

1. open browser A and browser B
2. authenticate browser A as the seeded signer
3. authenticate browser B as the seeded interpreter
4. reload both browsers
5. confirm identity still resolves correctly on both pages
6. confirm unauthenticated access is handled deterministically on:
   - `/queue`
   - `/interpreter`
   - `/call/[sessionId]`

Use two browser windows:

- signer flow: `/queue`
- interpreter flow: `/interpreter`

## Normal call

1. signer creates a call request
2. interpreter receives `assignment.offered`
3. interpreter accepts
4. both browsers join `/call/[sessionId]`
5. confirm role, actor id, and session id match on both pages
6. local and remote video render on both sides

## Accept / decline

1. interpreter declines an offer
2. signer remains queued
3. interpreter accepts a later offer
4. session is created and both can join

## Local hangup

1. start an active call
2. click `Hang up` in one browser
3. confirm local media stops
4. confirm the browser returns to `/`

## Remote leave

1. start an active call
2. hang up or close one browser
3. confirm the other browser shows remote departure/disconnected state

## Refresh during call

1. start an active call
2. refresh one `/call/[sessionId]` tab
3. confirm the page reconnects, re-authenticates, and attempts session rejoin
4. compare `Signaling state`, `Reconnect state`, and `Session rejoined`

## Temporary signaling loss

1. start an active call
2. interrupt websocket connectivity temporarily
3. confirm reconnect state changes to `reconnecting`
4. confirm reconnect either succeeds or fails truthfully
5. compare signaling loss against peer/ICE state before assuming media failed

## Relay / TURN observation

1. start an active call where direct connectivity is restricted
2. confirm `TURN configured: yes`
3. confirm `Relay candidate observed: yes` if relay is used

## Repeated calls

1. complete or hang up call A
2. create call B in the same browser session
3. confirm call B starts without stale peer ids, counters, or media state from call A
