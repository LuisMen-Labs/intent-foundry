# Security audit — 0.2.0-beta.3

Date: 2026-07-26

## Scope

Delta from beta.2: decision-shape rules, coaching-quality reference, `selectionLimitReason`, question validation, visible invalid-selection feedback, UI/server version and resource URI.

## Runtime findings

- Transport remains local stdio; no HTTP listener was added.
- No filesystem writes, credential access, dynamic evaluation, shell execution, telemetry, or new network calls were added.
- `selectionLimitReason` is bounded to 240 characters by the MCP schema and rendered as React text, not HTML.
- A restrictive multi-select maximum is rejected unless the caller supplies a visible reason.
- Answer validation still enforces question ID, kind, option IDs, uniqueness, bounds, label count, `Other` permission, and length.

## Verification

- TypeScript and tests: 16/16 pass.
- Exact regression: five compatible options with no maximum accept all five selections.
- UI single-file build: pass.
- MCP smoke list/call/resource: pass.
- `git diff --check`: pass.

## Built artifact hashes

- `mcp/server.cjs`: `a3a96e1202733e98f7f785eb00fe1d455b5964ff46ad2052188038b67d2fe080`
- `mcp/assets/index.html`: `d3c48d37af879393a9cffb4098c321913fba95b28de9edce7f166a4d1858e383`

## Residual risk

- The active Codex task retained beta.1 and cannot validate beta.3; a new task is required.
- Keyboard-only and real screen-reader tests remain pending.
- The previously documented transitive `@hono/node-server <2.0.5` advisory remains outside the current stdio execution path but blocks a stable release until removed or isolated.
- A rubric improves consistency but does not prove that users prefer the questions; comparative forward tests and user metrics remain required.
