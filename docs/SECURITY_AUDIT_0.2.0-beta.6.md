# Security audit — 0.2.0-beta.6

Date: 2026-07-26

## Scope

Delta from beta.5: one-stage internal MCP submission. The widget no longer invokes either the follow-up-message channel or `ui/update-model-context` after the answer tool succeeds.

## Findings

- Server validation and delivery are one MCP tool call. There is no second chat/context request, retry loop, background persistence, credential access, or financial operation.
- A true tool rejection remains a retryable `server-error`; a successful tool result is final from the widget's perspective.
- The answer remains deduplicated by active `questionId` in durable project state; automatic creation of a subsequent model turn still depends on the host.

## Verification required

- TypeScript, domain tests, package-contract tests, production build, MCP smoke test, Skill validator, and plugin validator.
- Actual-host verification requires a new Codex task because an existing task retains its resident MCP App.

## Residual risk

- A host may record the tool result without automatically starting the next model turn. The widget must not work around that boundary by drafting or sending a follow-up message.
- Accessibility and persistence-after-reopen remain incomplete.
- The known moderate transitive `@hono/node-server` advisory remains a stable-release blocker; the stdio runtime does not use its HTTP static-serving path.

## Decision

Accept for beta testing after all listed validations pass. Do not label stable.
