# E2E Regression Matrix

This matrix summarizes the current Web VRS regression coverage based on the tests and verification docs that exist now.

Authoritative sources used for this matrix:

- `tests/README.md`
- `tests/e2e/authenticated-happy-path.mjs`
- `tests/e2e/simultaneous-offer-fanout.mjs`
- `tests/e2e/hangup-reoffer-eligibility.mjs`
- `tests/e2e/disconnect-grace-active-session.mjs`
- `docs/verification/disconnect-grace-active-session.md`
- current lifecycle flow docs under `docs/flows/*`

Status meanings:

- `covered`
  - a current automated test or repeatable verification directly exercises this area
- `partial`
  - some aspect is exercised, but the area is not comprehensively proven
- `missing`
  - no current automated or documented verification directly covers the area

## Coverage matrix

| Lifecycle area | Current test or verification source | Automated or manual | Status | Notes |
| --- | --- | --- | --- | --- |
| auth | `tests/e2e/authenticated-happy-path.mjs`; all current E2E tests authenticate roles before proceeding | automated | covered | Seeded local auth is exercised, not production auth |
| call start | `tests/e2e/authenticated-happy-path.mjs`; `tests/e2e/simultaneous-offer-fanout.mjs`; `tests/e2e/hangup-reoffer-eligibility.mjs`; `tests/e2e/disconnect-grace-active-session.mjs` | automated | covered | Signer call creation is exercised repeatedly |
| queue entry | same four E2E tests above | automated | covered | Queue-to-offer path is covered through call start and subsequent offer assertions |
| interpreter offer | `tests/e2e/authenticated-happy-path.mjs`; `tests/e2e/hangup-reoffer-eligibility.mjs`; `tests/e2e/disconnect-grace-active-session.mjs` | automated | covered | Standard offer receipt is well exercised |
| simultaneous offer | `tests/e2e/simultaneous-offer-fanout.mjs` | automated | covered | Verifies both interpreters receive the same call offer |
| accept/decline | accept in all current E2E tests; decline path only indirectly documented in flow docs | automated + docs | partial | Accept is covered; decline/requeue path is not directly automated |
| session creation | `tests/e2e/authenticated-happy-path.mjs`; `tests/e2e/simultaneous-offer-fanout.mjs`; `tests/e2e/hangup-reoffer-eligibility.mjs`; `tests/e2e/disconnect-grace-active-session.mjs` | automated | covered | Session creation proven by both participants landing on `/call/[sessionId]` |
| active call | `tests/e2e/authenticated-happy-path.mjs`; follow-on call-state assertions in later E2E tests | automated | partial | Signaling-connected call entry is covered; media quality is not deeply verified |
| explicit hangup | `tests/e2e/hangup-reoffer-eligibility.mjs` | automated | covered | Explicit `Hang up` path and session cleanup are exercised |
| disconnect-grace expiry | `tests/e2e/disconnect-grace-active-session.mjs`; `docs/verification/disconnect-grace-active-session.md` | automated + manual | covered | Automated regression now exists; manual doc remains useful for diagnosis |
| stale session recovery | `tests/e2e/hangup-reoffer-eligibility.mjs`; `tests/e2e/disconnect-grace-active-session.mjs`; `docs/verification/disconnect-grace-active-session.md` | automated + manual | covered | Explicit leave and disconnect-grace stale-session cases are both checked |
| reoffer eligibility | `tests/e2e/hangup-reoffer-eligibility.mjs`; `tests/e2e/disconnect-grace-active-session.mjs` | automated | covered | Same interpreter can return to workspace and receive a new offer |
| stale call URL handling | no dedicated current E2E; runtime behavior is implemented in call page | implementation only | missing | Interpreter stale call URL escape is implemented but not yet automated |
| admin flow | no current test or verification doc | none | missing | Admin page is scaffold-only |
| timeout / no-accept flow | no current E2E; partially discussed in docs | docs only | missing | Neither-interpreter-accepts and queue timeout behavior are not covered |
| media / TURN reliability | `apps/web/src/app/turn-test/page.tsx` exists as a manual harness; no current E2E coverage | manual only | partial | TURN configuration exists, but full network-reliability verification is not automated |

## Current suite summary

Current strongest automated coverage areas:

- seeded auth
- call start
- queue to offer
- interpreter accept
- simultaneous bounded fanout
- explicit hangup cleanup
- disconnect-grace expiry cleanup
- post-cleanup interpreter reoffer eligibility

Current weakest areas:

- decline and requeue automation
- stale call URL regression automation
- timeout/no-accept path
- media/TURN reliability under real network failure conditions
- admin flow
