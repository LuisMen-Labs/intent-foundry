# Security audit — 0.2.0-beta.7

Date: 2026-07-26

## Scope

Delta from beta.6: navigable microsequences, revision by stable `questionId`, a bounded in-memory answer queue, and model-visible session retrieval.

## Findings

- Question and answer payloads are validated against the shared domain contract before storage or return.
- Revisions upsert by `questionId`; duplicates do not accumulate and answers for questions outside the active session are rejected.
- Session storage is process-local, bounded to 20 sessions, contains no credentials, and is intentionally not durable project memory.
- The widget calls only app-scoped save/finalize tools. It does not call `ui/message`, `sendFollowUpMessage`, or `ui/update-model-context` and therefore does not draft a follow-up chat message.
- `Finish` does not manufacture answers for untouched questions. A material branch must end the microsequence so stale downstream questions are not presented.
- The change adds no external network transport, financial execution, credential access, or filesystem persistence.

## Verification

- Domain, package-contract, and TypeScript checks passed: 29 tests in 5 suites.
- Production UI and stdio server build passed.
- MCP smoke test passed for present, save, revise, read, finalize, and resource retrieval.
- Browser regression passed for advance, restore, revise, complete, return, finalize, and 390 px responsive width without horizontal overflow.
- Official Skill and plugin validators passed.
- Sensitive-pattern review found only defensive documentation and negative contract tests; no credential, network, dynamic-code, or chat-message path was introduced.
- Dependency audit reports three moderate findings that collapse to the transitive `@hono/node-server` Windows static-serving advisory. This stdio-only server never imports `serveStatic`, opens an HTTP listener, or accepts a request path, so the affected path is not reachable in this beta architecture.
- Built artifact SHA-256 values:
  - `mcp/server.cjs`: `E54798B70FD58DE3650FA40577B246A64FB537FF73B1FF87C3AC0D3785090D3F`
  - `mcp/assets/index.html`: `FC1FA34FB7B11BDFF1481EF065088A60F1C71720916912DFD9EDC083AA6677A2`

## Residual risk

- The queue is lost if the MCP server restarts before the agent retrieves and persists the session in project memory.
- A host may save answers without automatically starting a model turn. The product must not bypass that host boundary by composing a user-visible prompt.
- The terminal surface may expose the Skill and MCP without rendering the graphical component; it must use the documented letter fallback.
- Keyboard-only and screen-reader testing remain incomplete.
- The known moderate transitive `@hono/node-server` advisory remains a stable-release blocker unless dependency review shows the affected path is unreachable or the dependency is upgraded.

## Decision

Accept for beta testing only after every publication gate passes. Do not label stable and do not treat the interface as authority for financial execution.
