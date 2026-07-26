# Security audit — 0.2.0-beta.8

Date: 2026-07-26

## Scope

Delta from beta.7: replace process-local session state with bounded temporary local persistence so app and model tool calls can cross MCP process boundaries.

## Data and trust boundaries

- Stored content is limited to presented questions, validated answer envelopes, finalization state, session ID, and update time.
- Files live under the operating system temporary directory, not the repository, plugin cache, user documents, or network storage.
- Session IDs are SHA-256 hashed before becoming filenames; user input never becomes a path segment.
- Every read revalidates the session, each answer, the expected session ID, file type, and a 256 KiB size limit.
- Storage is limited to 20 sessions and a 24-hour TTL. It is not durable project memory and is not synchronized across devices.
- No passwords, tokens, cookies, wallet material, credentials, telemetry, or network calls are introduced.

## Verification

- TypeScript and 32/32 tests passed, including independent store instances, TTL expiry, bounds/privacy contracts, and all prior question/delivery regressions.
- MCP smoke passed using two separate stdio server processes: the second process retrieved the answer saved through the first and finalized the session.
- Production UI and server build passed; official Skill and plugin validators passed.
- Local sensitive-pattern review found only defensive instructions and negative tests. No network, credential, dynamic-code, chat-message, or withdrawal path was introduced.
- Production dependency versions and lockfile graph are unchanged from beta.7: `@modelcontextprotocol/ext-apps 1.7.5`, SDK `1.29.0`, and transitive `@hono/node-server 1.19.15`. The external npm audit was not resent because that would transmit dependency metadata; the previously documented moderate Hono advisory therefore remains open without claiming a fresh online result.
- Built artifact SHA-256 values:
  - `mcp/server.cjs`: `4CF7CAE99AEAC14F9B559B16589307167C356CB8488A40F4055606BA0DAFAEC6`
  - `mcp/assets/index.html`: `29B795BBA62A2CFCE127A2AD8226B711DE45AB2D9E35C0344694672535378022`
- Still required: fresh-task host test answering R-001–R-004, retrieving the exact four answers, and opening the next block.

## Residual risk

- Another process under the same operating-system account may be able to read temporary files according to host filesystem permissions. The stored payload must therefore never contain secrets.
- A crash during an atomic replacement can leave an ignored `.tmp` file until operating-system cleanup; only hashed `.json` files are read.
- The known moderate transitive `@hono/node-server` advisory remains a stable-release blocker; the stdio runtime does not use its HTTP static-serving path.

## Decision

The code is acceptable for a beta release and fresh-host verification. Do not describe the end-to-end host issue as closed or publish stable until the real R-001–R-004 retrieval test passes.
