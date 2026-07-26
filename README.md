# Intent Foundry

**Understand first. Act with clarity.**

Intent Foundry is an open-source Codex plugin that turns incomplete ideas into verified, portable intent before AI acts. **Guided Clarity** supplies the reasoning workflow; its MCP App renders the decision as a native interactive card instead of forcing the user to type confirmation words.

## What makes it different

- One high-value question per turn instead of a static questionnaire.
- Guided choices by default, with an open question only when choices would distort the answer.
- Native single-select, multi-select, ranking, and written `Other` controls in compatible ChatGPT/Codex hosts.
- Recommendations with reasons, never hidden steering.
- Confirmed, inferred, and unknown information kept separate.
- Contradictions, biases, falsifiers, and permissions made explicit.
- Durable state and a portable Markdown handoff.
- Spanish or English interaction that follows the user's language.
- Silent draft persistence in the host, without an Intent Foundry account, API key, or telemetry.

## Use it

Invoke `$guided-clarity` when you want to clarify an idea, compare a decision, challenge a plan, audit missing requirements, or prepare a handoff before execution.

Example prompts:

- `Use $guided-clarity to clarify my product idea before we build it.`
- `Use $guided-clarity to help me choose, and show the tradeoffs.`
- `Use $guided-clarity to challenge my assumptions and create a portable handoff.`

## Two product layers

- **Full Codex plugin (`0.2.0-beta.3`):** Skill + local MCP server + interactive UI. This is the premium experience under active validation.
- **Portable Skill:** the reasoning workflow alone remains usable in compatible Skill hosts such as Claude, Gemini, Antigravity, and Codex, but its visual controls depend on the host.

## Install the portable Skill

Ask Codex:

```text
Use $skill-installer to install https://github.com/LuisMen-Labs/intent-foundry/tree/v0.1.1/skills/guided-clarity
```

Or install with the official Skill installer script available in your Codex environment, using repository `LuisMen-Labs/intent-foundry`, path `skills/guided-clarity`, and ref `v0.1.1`.

For a repository-scoped installation, copy `skills/guided-clarity` to `<your-repository>/.agents/skills/guided-clarity`. Restart Codex if the Skill does not appear immediately.

Then invoke it explicitly:

```text
$guided-clarity Help me clarify this decision before acting.
```

The repository can be shared now for source installation. One-click discovery in the public Plugins Directory remains pending marketplace review.

## Gemini, Antigravity, and Claude

Platform-ready downloads and exact installation paths are documented in [docs/INSTALLATION.md](docs/INSTALLATION.md).

- [Gemini-ready ZIP](https://github.com/LuisMen-Labs/intent-foundry/releases/download/v0.1.1/guided-clarity-gemini-v0.1.1.zip)
- [Claude-ready ZIP](https://github.com/LuisMen-Labs/intent-foundry/releases/download/v0.1.1/guided-clarity-claude-v0.1.1.zip)

## Status

Version `0.2.0-beta.3` adds a decision-shape classifier, a six-gate coaching-quality rubric, rejection of unexplained multi-select caps, and visible reasons for genuine selection limits. Public release, cross-host testing, a screen-reader audit, and comparative user evidence remain pending. Adoption, effectiveness, and superiority over another product are hypotheses to test, not established claims.

The integrated product hypothesis and its acceptance tests are documented in [docs/DIFFERENTIATION.md](docs/DIFFERENTIATION.md).
The runtime loop and package boundaries are documented in [docs/FLOW.md](docs/FLOW.md).

## License

MIT. See [LICENSE](LICENSE).
