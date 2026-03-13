# Stop After Two Failures

## Purpose
Prevent repeated low-signal debugging attempts when the same method has already failed twice.

## When to use
- Two consecutive fixes did not solve the same bug
- Repeated UI tweaks without evidence
- Repeated signaling guesses without event timelines
- Repeated backend guesses without exact throw-site evidence

Primary ownership:
- Debugging method control

## Inputs / evidence
- Previous two failed attempts
- What method was repeated
- What evidence was missing

## Required workflow
1. Stop the repeated method.
2. Name the previous two failed attempts.
3. State what evidence was missing.
4. Switch to a higher-signal method:
   - instrumentation
   - event timeline logging
   - `getStats()` watchdog
   - backend membership and lifecycle tracing
   - explicit acceptance test

## Hard rules
- Do not keep shipping “maybe this helps” patches.
- Do not refactor as a substitute for evidence.
- If the repeated failures span layers, return to `skills/debug/bug-triage.md`.

## Output
- Previous two failed attempts
- Repeated method identified
- New method chosen
- Exact evidence to collect next

## Recommended usage order
- Use this when debugging momentum is degrading.
- Then return to `skills/debug/bug-triage.md`.
- Finish with `skills/debug/regression-gate.md` after the new method produces a fix.
