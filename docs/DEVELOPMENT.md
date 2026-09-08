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

## Recovery regression browser test

After `npm run build`, run `npm run test:browser` with Playwright available in the development environment. Alternatively set `INTENT_FOUNDRY_PLAYWRIGHT_MODULE` to an installed Playwright `index.mjs`. Set `INTENT_FOUNDRY_BROWSER_CHANNEL=msedge` (or `chrome`) to use an installed browser rather than downloading Chromium.

The test serves only on loopback, uses a headless isolated browser, and relays a simulated MCP Apps host to the real bundled server. It checks multi-select, missing widget cache, lost save/finalize replies and finalized remount. It never loads the live user's session store. This is integration coverage, not proof of behavior in every native host.
