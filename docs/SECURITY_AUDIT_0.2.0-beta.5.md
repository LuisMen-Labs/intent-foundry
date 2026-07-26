# Security audit — 0.2.0-beta.5

Date: 2026-07-26

## Scope

Delta from beta.4: separate server-validation and model-context delivery states, context-only retry after server acceptance, explicit app-only visibility for `submit_guided_answer`, and focused delivery tests.

## Findings

- The internal submission tool remains local, read-only, non-destructive, and performs no network access, credential handling, file writes, or financial operation.
- `submit_guided_answer` is now declared with `ui.visibility: ["app"]`; it is intended for the rendered component rather than direct model invocation.
- A failed model-context update no longer causes the component to forget that server validation succeeded. Retrying the same answer skips the server call and retries only context delivery.
- Durable project state still deduplicates by active `questionId`; beta.5 does not claim exactly-once delivery across an unacknowledged host failure.
- Error copy now distinguishes server rejection from pending chat-context delivery without exposing the answer payload in the card.

## Verification

- TypeScript typecheck and 24 tests pass, including three delivery-stage regressions.
- Production UI and server builds pass.
- MCP smoke test passes with the v5 resource URI.
- Actual-host behavior requires reinstall and a new Codex task because an open task retains the resident MCP component.

## Residual risk

- A host could apply a context update and lose its acknowledgement; the client cannot prove exactly-once delivery without host-level idempotency. The active-question contract makes duplicate envelopes harmless to durable state.
- Keyboard, screen-reader, persistence-after-reopen, and cross-host tests remain incomplete.
- The previously documented moderate transitive dependency finding remains a blocker for a stable release even though the current stdio path does not expose the affected HTTP runtime.

## Decision

Accept for beta testing only. Do not label stable until actual-host retry behavior, accessibility, persistence, and dependency remediation are verified.
