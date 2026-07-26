# Security audit — 0.2.0-beta.2

Date: 2026-07-26

## Result

No critical or high dependency finding is present. Three moderate npm findings resolve to one transitive advisory: `@hono/node-server <2.0.5` path traversal in its Windows static-file helper.

## Reachability decision

The current Intent Foundry runtime does not import the Hono adapter, call `serveStatic`, open an HTTP listener, accept paths, or expose network transport. It starts only `StdioServerTransport`, reads one fixed bundled HTML path, and rejects startup without `--stdio`. The reported vulnerable path is therefore not reachable in this release architecture.

This is a scoped risk acceptance, not a claim that the dependency is clean. Forced remediation would downgrade the current MCP Apps peer set or override a major transitive dependency outside the SDK's declared range. Keep the stable release blocked until an upstream-compatible dependency set removes the advisory, or replace the SDK surface with a smaller verified runtime.

## Beta.2 controls

- Question payloads are schema-checked and domain-validated.
- A recommendation requires exactly one recommended option, a separate reason, and a material downside.
- Rank and single-choice bounds are normalized server-side.
- The UI rejects malformed structured question output.
- Submitted answers use a versioned marker and are revalidated by the Skill against durable active state.
- No account, credential, outbound request, telemetry, or persistent server-side user store was added.

## Remaining gates

- Actual-host beta.2 render and submit after reinstall.
- Keyboard-only and screen-reader audit in the host iframe.
- Dependency advisory removal before stable release.
- Comparative user testing before any superiority claim.

## Built artifact hashes

- `mcp/assets/index.html`: `625b31d6b324046a0e737d358839ae0d6f8427ec9159e0360bd4553de9a059a8`
- `mcp/server.cjs`: `a0f7dddc410e424afd00c0c9bea3aa755db4677a932b7f58dc342796729136e7`
