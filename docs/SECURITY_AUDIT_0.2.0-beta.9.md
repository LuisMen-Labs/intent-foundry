# Security audit — 0.2.0-beta.9

Date: 2026-07-26

## Scope

Delta from beta.8: continuous predetermined reviews, ordered server-side checkpoints, and global question/block progress without a new chat turn between blocks.

## Data and trust boundaries

- A checkpoint names only its ID and the last question in its ordered block. The server derives the required question IDs from the validated session; the widget cannot declare a block complete by itself.
- A checkpoint succeeds only when every question in that block has a validated stored answer. Skips remain explicit answers and are not converted into user decisions.
- Sessions accept at most 32 questions, 16 checkpoints, and 128 KiB of serialized question data. The complete stored record remains capped at 256 KiB.
- Checkpoint IDs and question IDs are bounded strings. Session IDs are still hashed before filesystem use; no user-controlled value becomes a path segment.
- Storage remains local to the operating-system temporary directory, limited to 20 sessions and 24 hours. No network, telemetry, credential access, chat-message channel, financial operation, or withdrawal permission was added.

## Verification

- TypeScript and 36/36 tests passed, including ordered checkpoints, invalid final boundaries, oversized-session rejection, delivery regressions, and package contracts.
- Production UI and server builds passed.
- MCP smoke passed with a real 23-question sequence and six checkpoints; all 23 validated answers and all checkpoint IDs were recovered from a second stdio MCP process.
- Local sensitive-pattern review found only the intended temporary file store, defensive documentation, bundled dependencies, and internal app tool calls.
- The Skill and plugin validator scripts were invoked but could not run because the available Python runtimes lack PyYAML. Manifest/version alignment and Skill integration remain covered by the TypeScript package-contract tests; this is a validator-environment limitation, not a claim that the official validators passed.
- Production dependencies are unchanged from beta.8. The previously documented moderate transitive `@hono/node-server` advisory remains open and blocks a stable release; the stdio runtime does not use its HTTP static-serving path.
- Built artifact SHA-256 values:
  - `mcp/server.cjs`: `ACBA313C64194F638BA2F72E67386043BA5EECBCF1120DCA8CD741CA192B35D4`
  - `mcp/assets/index.html`: `70CB9F34D7AE58FF3F8E9FAB44D65C9EC6F4A064F08D40CBBE5481A033D0AB73`

## Residual risk

- Every question in a checkpointed review must remain valid regardless of previous selections. Misclassifying a dependent branch as predetermined is a reasoning risk that server validation cannot detect.
- Another process under the same operating-system account may be able to read temporary files according to host permissions. Sessions must never contain secrets.
- The current Codex task keeps the previously loaded beta.8 MCP process. A new task is required to verify the beta.9 widget and its uninterrupted 23-question navigation in the real host.

## Decision

Acceptable for local beta installation and a new-task host test. Do not publish stable until the host test, assistive-technology review, and transitive dependency blocker are resolved.
