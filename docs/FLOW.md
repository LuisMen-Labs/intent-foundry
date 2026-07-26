# Flow and architecture

Guided Clarity is a stateful decision loop with a native interaction layer, not a static questionnaire.

## Runtime flow

```text
Read context
    ↓
Select mode and highest-impact unknown
    ↓
Design one low-friction question
    ↓
Call present_guided_question
    ↓
Render choices + Other in the MCP App
    ↓
Submit a structured answer to the local MCP server
    ↓
Classify: Confirmed | Inferred | Unknown
    ↓
Persist durable project state silently
    ↓
Adapt next question — or — produce reviewed Intent Pack
```

For a predetermined review whose questions remain valid under every earlier answer, the model may send the complete sequence once with ordered checkpoints:

```text
Render Question 1 of N · Block 1 of B
    ↓
Save and validate each answer
    ↓
At a block boundary, verify the whole block server-side
    ↓
Advance in the same widget without a new chat turn
    ↓
Finalize and retrieve one validated session snapshot
```

Adaptive branches remain separate sequences because a widget must not precompute a question whose premise depends on an earlier answer.

The modes change the reasoning lens, not the interaction contract:

- **Discover:** reveal goals, constraints, and success criteria.
- **Decide:** compare alternatives against confirmed criteria.
- **Challenge:** expose assumptions, incentives, biases, and falsifiers.
- **Audit:** inspect an existing plan or state for gaps and contradictions.

## Question contract

Every normal question must:

1. resolve the highest-impact unknown;
2. show two to four materially different choices;
3. expose a consequence or tradeoff for each choice;
4. preserve a written `Other` path;
5. show exactly one localized recommendation when confirmed criteria support it;
6. explain the recommendation and its downside separately;
7. remain unconfirmed until the user chooses it.

The MCP App supports single selection, multiple selection, ranking, global question/block progress, host-local draft state, server-side checkpoints, and disabled-until-valid submission. A separate “type confirm” step is not part of the flow. Operational reports appear only on request, pause, failure, or handoff.

An open-first question is an exception for narratives, sensitive context, original wording, or cases where choices would materially bias the answer.

## Package structure

```text
intent-foundry/
├── .codex-plugin/plugin.json       # Plugin identity and discovery metadata
├── .mcp.json                       # Local MCP process registration
├── server/src/server.ts            # Tool schema, validation, and UI resource
├── ui/src/                         # Accessible interactive component
├── shared/question.ts              # Answer contract and validation
├── shared/session.ts               # Sequence, checkpoint, and progress contract
├── mcp/                            # Reproducible bundled runtime artifacts
├── skills/guided-clarity/          # Reasoning workflow and portable fallback
├── tests/                          # Behavior, domain, and MCP smoke tests
└── docs/DIFFERENTIATION.md          # Product contract and metrics
```

`SKILL.md` owns reasoning and interview sequencing. The MCP tool owns the typed question contract. The component owns interaction ergonomics and host-local draft state. Durable project state remains explicit Markdown rather than hidden server storage. Compatible hosts without MCP Apps use the portable Skill contract.

The Skill-to-MCP bridge is mandatory when the tool exists: the model calls the namespaced question or sequence tool, the component stores validated answers and checkpoints through app-only MCP transports, and the Skill retrieves the session snapshot before durable persistence. Tool availability without invocation is treated as an integration failure.
