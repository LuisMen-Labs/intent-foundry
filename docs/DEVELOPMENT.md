# Development

## Requirements

- Node.js 22 or later for the TypeScript test runner used here.
- npm.

## Reproducible build

```text
npm ci
npm run check
npm run build
npm run smoke:mcp
```

`npm run build` creates a self-contained UI at `mcp/assets/index.html` and a bundled stdio server at `mcp/server.cjs`. Plugin users run those committed artifacts and do not need a development server.

## Visual preview

Serve `mcp/assets` only on loopback and open one of:

```text
/?preview=single
/?preview=multi
/?preview=rank
```

`preview=single` currently exercises a three-question navigable microsequence. Preview mode is a local demonstration fixture. It does not call the MCP host or transmit an answer.

## Release gates

- Type check and domain tests pass.
- MCP list/call/resource smoke test passes.
- Plugin and Skill validators pass.
- Browser interaction and accessibility snapshots pass.
- Dependency advisory detail is reviewed and no unacceptable runtime finding remains.
- Built artifact hashes are recorded.
- Privacy, security, installation, and version documentation match behavior.
