# Installation and sharing

Use stable Skill release `v0.1.1` for portable installation. The full interactive plugin is currently `0.2.0-beta.10` and is not yet a stable marketplace release.

## Message you can share

> **Intent Foundry — Guided Clarity** is a Skill that turns ambiguous ideas into verified, portable intent before AI acts. It works as a structured thinking partner: it asks one high-value question at a time, lets you answer by choosing one or several options or writing freely, and clearly marks any recommended option with its reasoning and downside.
>
> Use it to define a project, compare alternatives, discover requirements, challenge a high-conviction plan, expose assumptions or contradictions, and prepare work for another person or AI. It keeps confirmed decisions separate from AI inferences and unresolved questions, then creates an Intent Pack that can be reviewed and resumed in another session or compatible model.
>
> The Skill does not replace your judgment, silently confirm its own recommendations, or authorize consequential actions. You remain the decision-maker.
>
> Repository and installation options: https://github.com/LuisMen-Labs/intent-foundry

Mensaje en español:

> **Intent Foundry — Guided Clarity** es una Skill que convierte ideas ambiguas en intención verificada y portable antes de que la IA actúe. Funciona como un compañero de pensamiento estructurado: hace una pregunta de alto valor por turno, permite elegir una o varias alternativas o responder libremente, y marca claramente cualquier opción recomendada explicando su razón y su principal desventaja.
>
> Úsala para definir un proyecto, comparar alternativas, descubrir requisitos, cuestionar un plan en el que tienes mucha convicción, detectar supuestos o contradicciones y preparar el trabajo para otra persona o IA. Mantiene separadas las decisiones confirmadas, las inferencias de la IA y las preguntas todavía abiertas; al final genera un Intent Pack revisable que puede retomarse en otra sesión o modelo compatible.
>
> La Skill no reemplaza tu criterio, no convierte automáticamente sus recomendaciones en decisiones y no autoriza acciones importantes. Tú conservas la decisión final.
>
> Repositorio e instrucciones de instalación: https://github.com/LuisMen-Labs/intent-foundry

## Gemini Apps with Spark

Requirements and availability depend on account, subscription, region, and Gemini Spark access.

1. Download [guided-clarity-gemini-v0.1.1.zip](https://github.com/LuisMen-Labs/intent-foundry/releases/download/v0.1.1/guided-clarity-gemini-v0.1.1.zip).
2. Open `gemini.google.com`.
3. Switch to **Spark**, then open **Skills**.
4. Select **Upload** and choose the ZIP.
5. Review the files and create the Skill.
6. In a Spark task, type `/` and select `guided-clarity`, or ask Gemini to use it.

Google requires `SKILL.md` at the ZIP root. The Gemini package follows that layout.

Official guide: https://support.google.com/gemini/answer/17094296

## Google Antigravity

Download or clone this repository, then copy the complete folder `skills/guided-clarity` to one of:

- Workspace: `<workspace-root>/.agents/skills/guided-clarity/`
- Global: `~/.gemini/config/skills/guided-clarity/`

Start a new conversation and ask `What skills are available?`. Mention `guided-clarity` explicitly if automatic activation does not occur.

Official guide: https://antigravity.google/docs/skills

## Gemini CLI

Copy `skills/guided-clarity` into the target project's `.agents/skills/guided-clarity/` directory, start Gemini CLI, and run `/skills` to verify discovery.

Official codelab: https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli

## Claude web or desktop

1. Download [guided-clarity-claude-v0.1.1.zip](https://github.com/LuisMen-Labs/intent-foundry/releases/download/v0.1.1/guided-clarity-claude-v0.1.1.zip).
2. Enable **Code execution and file creation** in Claude settings when required.
3. Open **Customize → Skills**.
4. Select **+ → Create skill → Upload a skill**.
5. Upload the Claude ZIP and enable the Skill.
6. Ask Claude to use Guided Clarity for the task.

The Claude package contains `guided-clarity/` as the ZIP root folder, matching Claude's packaging guidance.

Official guides: https://support.claude.com/en/articles/12512180-use-skills-in-claude and https://support.claude.com/en/articles/12512198-how-to-create-custom-skills

## Claude Code

Download or clone this repository, then copy `skills/guided-clarity` to:

- Personal: `~/.claude/skills/guided-clarity/`
- Project: `<project-root>/.claude/skills/guided-clarity/`

Invoke it with:

```text
/guided-clarity Help me clarify this decision before acting.
```

Claude Code watches existing Skill directories for changes. If the top-level Skills directory did not exist when the session began, restart Claude Code.

Official guide: https://code.claude.com/docs/en/skills

## Integrity

SHA-256 values are published with each stable release. Do not reuse hashes from another version.

## Functional boundary

The workflow instructions are portable. Native choice controls, file persistence, automatic activation, and cross-session memory still depend on the host platform and its permissions. Never assume that installing the Skill grants authority for downstream actions.
