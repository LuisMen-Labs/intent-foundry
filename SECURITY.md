# Security policy

Report vulnerabilities through GitHub private security advisories. Do not disclose exploitable details in a public issue before a fix is available.

Intent Foundry has a local stdio MCP runtime but no hosted service or credentials. Its main risks are instruction manipulation, malicious or malformed question payloads, accidental persistence of secrets, unsafe downstream authority, supply-chain dependencies, and untrusted content entering an Intent Pack.

The MCP tool validates field sizes, option uniqueness, recommendation consistency, progress, and selection bounds. React renders all model-provided text as escaped content. The runtime has no HTTP listener, telemetry, filesystem write path, shell invocation, environment-secret access, or withdrawal/execution authority.

Release artifacts are bundled and their hashes are recorded during release validation. Source builders should install from the committed lockfile and review dependency advisories before publishing.
