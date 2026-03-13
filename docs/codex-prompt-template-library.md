# Codex Prompt Template Library

## 1. Implementation Plan Template

Create a bounded implementation plan for the following feature.

FEATURE `<feature name>`

OBJECTIVE  
Explain the goal of the feature.

SCOPE  
Describe exactly what should be included.

DO NOT CHANGE

* websocket contracts, unless existing signaling contracts are insufficient for the feature
* session states
* queue behavior
* auth behavior
* signaling behavior
* media transport behavior

RULES

* keep the change bounded
* prefer existing canonical paths
* avoid protocol redesign
* signaling remains transport only
* if existing contracts are insufficient, explicitly say so and limit any contract change to the minimum required

OUTPUT EXACTLY:

# `<Feature Name>` Plan

## 1. Recommended next task

## 2. Why this task is next

## 3. Files likely involved

## 4. Invariants to preserve

## 5. Acceptance criteria

## 6. Verification steps

---

## 2. Implementation Task Template

Implement the following task exactly as planned.

TASK `<task name>`

OBJECTIVE  
Explain the expected behavior.

FILES

* file1
* file2

DO NOT CHANGE

* websocket contracts, unless the planned task explicitly requires the minimum contract addition
* session states
* queue behavior
* auth behavior
* signaling behavior
* media transport behavior

RULES

* keep the patch bounded
* reuse existing canonical paths
* avoid protocol redesign
* if a contract change is required, keep it minimal and aligned with docs/contracts and packages/contracts

OUTPUT EXACTLY:

# `<Task Name>` Change Report

## 1. Files changed

## 2. Behavior improved

## 3. Commands run

## 4. Results

## 5. Remaining gaps

---

## 3. Bug Investigation Template

Investigate the following issue.

PROBLEM  
Describe the observed behavior.

EXPECTED BEHAVIOR  
Describe what should happen.

FILES TO INSPECT  
List suspected files.

RULES

* do not implement a fix yet
* identify the most likely root cause
* keep the analysis bounded
* call out whether the issue is implementation-only or reveals a missing contract/doc

OUTPUT EXACTLY:

# Issue Diagnosis

## 1. Observed behavior

## 2. Expected behavior

## 3. Likely failure point

## 4. Files involved

## 5. Recommended fix approach

---

## 4. Runtime Validation Template

Validate the runtime behavior of the following feature.

FEATURE `<feature name>`

TEST SCENARIOS

1. scenario one
2. scenario two

OUTPUT EXACTLY:

# Runtime Validation Summary

## 1. Scenario 1 result

## 2. Scenario 2 result

## 3. Any inconsistency

## 4. Recommendation

---

## 5. Architecture Guardrail Template

Follow these architecture guardrails.

RULES

* signaling is transport only
* session authority belongs to backend
* websocket event names must remain stable
* session state vocabulary must remain unchanged
* avoid adding new events unless strictly required
* do not redesign queue/auth/media layers
* if an existing contract cannot carry the requested feature, explain why and propose the smallest compliant addition

If a requested change violates these guardrails,
explain the conflict instead of implementing it.

---

## 6. UI Improvement Template

Improve UI presentation only.

PAGE `<page path>`

OBJECTIVE  
Clarify layout and usability.

DO NOT CHANGE

* backend logic
* signaling
* session states
* media behavior

RULES

* presentation-only changes
* keep diagnostics available but visually de-emphasized

OUTPUT EXACTLY:

# UI Improvement Report

## 1. Files changed

## 2. UI behavior improved

## 3. Commands run

## 4. Results

## 5. Remaining UI gaps

---

## 7. Minimal Contract Extension Template

Use this when a bounded feature cannot be implemented through current canonical contracts.

FEATURE `<feature name>`

OBJECTIVE  
Explain the user-visible behavior to add.

WHY EXISTING CONTRACTS ARE INSUFFICIENT  
State exactly why the current websocket contract cannot truthfully carry the feature.

ALLOWED CHANGE

* one minimal contract addition only if required
* update authoritative docs/contracts first
* update packages/contracts to match
* preserve signaling as transport only

DO NOT CHANGE

* session states
* queue behavior
* auth behavior
* media transport behavior
* reconnect semantics except where truthful UI requires it

RULES

* keep scope bounded
* prefer one canonical event/message path
* no persistence unless explicitly requested
* no protocol redesign

OUTPUT EXACTLY:

# `<Feature Name>` Contract Extension Plan

## 1. Required contract change

## 2. Why existing path is insufficient

## 3. Files likely involved

## 4. Invariants to preserve

## 5. Acceptance criteria

## 6. Verification steps
