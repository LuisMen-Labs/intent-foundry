# Security audit — 0.2.0-beta.10

Date: 2026-07-26

## Scope

Delta from beta.9: add an explicit, localized completion instruction when the host does not automatically resume the model after finalization.

## Behavior and trust boundary

- The final screen shows the number of locally saved answers and tells the user to return to the chat and type `Continue` when automatic continuation does not occur.
- The widget does not call `ui/message`, `sendFollowUpMessage`, `ui/update-model-context`, clipboard, network, or another delivery channel.
- No permissions, persistence limits, question/answer schemas, filesystem paths, dependencies, or financial capabilities changed.
- The instruction does not claim that the model already retrieved the answers; retrieval still occurs only through `read_guided_session` in a later model turn.

## Verification

- TypeScript and 37/37 tests passed, including a contract regression for the final instruction and continued absence of follow-up-message APIs.
- Production UI/server build and MCP smoke passed.
- Local sensitive-pattern review found only defensive documentation and negative contract assertions; no new network, credential, shell, dynamic-code, or chat-message path was introduced.
- Dependencies are unchanged from beta.9. The previously documented moderate transitive `@hono/node-server` advisory remains a stable-release blocker.
- Built artifact SHA-256 values:
  - `mcp/server.cjs`: `3CB9551C55CD787791FCCE69D1F818572AAC2F814D9D2EB40FB8B3367FE4A559`
  - `mcp/assets/index.html`: `BA8655BC9B250A69B0F48F05FF20B9EB17A81D33D984633DBB611F1EC994CFF5`

## Residual risk

- The user must still send a normal chat message when the host does not resume automatically. Automating that step would reintroduce a host-controlled confirmation path or expand app authority.
- The current task retains the beta.9 MCP/UI loaded at task start. Visual verification of beta.10 requires a new task after installation.

## Decision

Acceptable for local beta installation and a new-task visual check. Stable release remains blocked by assistive-technology testing and the transitive dependency advisory.
