# Security audit — 0.2.0-beta.1

Date: 2026-07-25

## Scope and provenance

- Repository: `LuisMen-Labs/intent-foundry`
- Branch: `main`
- Base commit reviewed: `f7e2b7049935fd559cecb15ad2c2fc12954f8dc0`
- License: MIT
- Added surface: local stdio MCP server, embedded MCP App, build dependencies, bundled artifacts.

## Trust boundaries

- Model/tool input → Zod schema and semantic checks → `structuredContent`.
- `structuredContent` → React text rendering → embedded host UI.
- User selection → structured JSON text → active host conversation.
- Draft selection → optional host widget-state API.

## Findings

### Controls present

- No HTTP listener, outbound fetch, telemetry, credential read, environment-secret read, filesystem write, shell call, dynamic evaluation, or destructive operation in source runtime.
- The MCP tool constrains field sizes, option count, unique IDs, recommendation consistency, selection bounds, and progress.
- React escapes question and option text; no raw HTML rendering path is used.
- Runtime uses stdio and declares read-only, non-destructive, closed-world annotations.
- Dependencies are exact-version pinned and a lockfile is committed.

### Open finding: dependency advisories

`npm install --package-lock-only --ignore-scripts` reported three moderate advisories. Exact advisory detail was not retrieved because the audit endpoint requires explicit authorization to transmit the dependency/version list to npm. Stable publication is blocked until these are identified and either fixed or documented as non-exploitable in this architecture.

### Residual risk

- The model can still generate misleading choices; the Skill's epistemic and recommendation rules remain a necessary control.
- The host receives submitted answers and may persist widget state under its own policy.
- Bundled third-party code increases review volume; build hashes detect drift but do not prove absence of vulnerabilities.

## Classification

**Beta use acceptable with controls; stable/public marketplace release blocked.** Use the committed bundle locally, keep the MCP transport on stdio, do not add credentials, and do not expose a development server to a network.

## Final local artifact hashes

- `mcp/server.cjs`: `1689C49E42EA249263A9230562A3D9FF8ED2426DEF08E70D756FE3F5F15DD885`
- `mcp/assets/index.html`: `EEF29B2EE883A393B73293AA8B4782CACD1504D767AD27E7F7A761E4BA7D1537`
