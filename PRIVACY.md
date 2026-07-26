# Privacy

Intent Foundry runs a local stdio MCP process and an embedded question component. It does not create an Intent Foundry account, collect telemetry, contact an Intent Foundry service, or require API keys. Single-question answers are returned to the active host conversation; draft selections may be stored by that host's widget-state facility.

For navigable question blocks, Intent Foundry temporarily stores the presented questions and validated answer envelopes in the operating system's local temporary directory. Filenames are derived from hashed session IDs. The queue is limited to 20 sessions, expires after 24 hours, is not synchronized across devices, and is not durable project memory. Do not enter secrets or authentication material in guided answers.

Guided Clarity may write interview state or an Intent Pack only when the active AI environment has file access and the user has requested or permitted durable project context. Those files remain in the user's selected environment and are governed by that environment's policies.

The Skill instructs agents not to persist passwords, tokens, cookies, private keys, seed phrases, authentication material, or unnecessary personal data. Users should still review generated files before sharing or committing them.

The active AI host processes conversation, widget state, and file content under its own privacy policy. Intent Foundry does not control those platforms. The bundled runtime does not expose an HTTP listener or make outbound network requests.

Questions or reports: open a private security advisory or an issue at https://github.com/LuisMen-Labs/intent-foundry.

Last updated: 2026-07-26.
