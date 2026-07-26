# Flow and structure

Guided Clarity is a small stateful decision loop, not a static questionnaire.

## Runtime flow

```text
Read context
    ↓
Select mode and highest-impact unknown
    ↓
Design one low-friction question
    ↓
Present native choices + Other when supported
    ↓
Capture selection, correction, or uncertainty
    ↓
Classify: Confirmed | Inferred | Unknown
    ↓
Persist state and recommendation status
    ↓
Adapt next question ── or ── produce reviewed Intent Pack
```

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
5. show exactly one localized recommendation when evidence and confirmed criteria support it;
6. explain the recommendation and its downside separately;
7. remain unconfirmed until the user chooses it.

An open-first question is an exception for narratives, sensitive context, original wording, or cases where choices would bias the answer.

## Package structure

```text
intent-foundry/
├── .codex-plugin/plugin.json       # Plugin identity and discovery metadata
├── skills/guided-clarity/
│   ├── SKILL.md                    # Short runtime contract and loop
│   ├── agents/openai.yaml          # Skill UI metadata
│   ├── references/
│   │   ├── modes.md                # Reasoning lenses
│   │   ├── question-design.md      # Detailed question UX rules
│   │   ├── quality-gates.md        # Acceptance gates
│   │   └── portability.md          # Cross-model handoff rules
│   └── assets/
│       ├── INTERVIEW_STATE.template.md
│       └── INTENT_PACK.template.md
├── tests/marketplace-cases.md       # Behavioral regression cases
└── docs/DIFFERENTIATION.md          # Product contract and metrics
```

`SKILL.md` owns the runtime sequence. References own detailed rules without duplicating the core. Assets define durable outputs. Tests protect observable behavior. The host controls whether choices appear as native controls or a compliant fallback; the Skill never claims UI capabilities the host does not expose.
