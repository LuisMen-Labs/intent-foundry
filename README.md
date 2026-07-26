# Intent Foundry

**Understand first. Act with clarity.**

Intent Foundry is an open-source Codex plugin that turns incomplete ideas into verified, portable intent before AI acts. Its first Skill, **Guided Clarity**, asks one adaptive question at a time, explains recommendations, challenges assumptions, and creates an Intent Pack another chat, device, model, or agent can continue.

## What makes it different

- One high-value question per turn instead of a static questionnaire.
- Single choice, multiple choice, or free response.
- Native choice controls when available, with a plain-text fallback everywhere else.
- Recommendations with reasons, never hidden steering.
- Confirmed, inferred, and unknown information kept separate.
- Contradictions, biases, falsifiers, and permissions made explicit.
- Durable state and a portable Markdown handoff.
- Spanish or English interaction that follows the user's language.
- No external service, account, API key, or telemetry.

## Use it

Invoke `$guided-clarity` when you want to clarify an idea, compare a decision, challenge a plan, audit missing requirements, or prepare a handoff before execution.

Example prompts:

- `Use $guided-clarity to clarify my product idea before we build it.`
- `Use $guided-clarity to help me choose, and show the tradeoffs.`
- `Use $guided-clarity to challenge my assumptions and create a portable handoff.`

## Install from source

Ask Codex:

```text
Use $skill-installer to install https://github.com/LuisMen-Labs/intent-foundry/tree/v0.1.0/skills/guided-clarity
```

Or install with the official Skill installer script available in your Codex environment, using repository `LuisMen-Labs/intent-foundry`, path `skills/guided-clarity`, and ref `v0.1.0`.

For a repository-scoped installation, copy `skills/guided-clarity` to `<your-repository>/.agents/skills/guided-clarity`. Restart Codex if the Skill does not appear immediately.

Then invoke it explicitly:

```text
$guided-clarity Help me clarify this decision before acting.
```

The repository can be shared now for source installation. One-click discovery in the public Plugins Directory remains pending marketplace review.

## Status

Version `0.1.0` is an evidence-seeking public preview. Adoption, effectiveness, and recommendation quality are hypotheses to test, not established claims.

The integrated product hypothesis and its acceptance tests are documented in [docs/DIFFERENTIATION.md](docs/DIFFERENTIATION.md).

## License

MIT. See [LICENSE](LICENSE).
