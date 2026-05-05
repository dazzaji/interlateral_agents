# Sprint Process Levels

Process levels are guides, not achievement levels or mandatory gates. Use the lowest level that fits the actual risk, and downgrade or upgrade when evidence shows the work is simpler or riskier than expected.

## Quick Risk Test

Would a wrong action affect production users, mutate live data, spend money, expose credentials, or be hard to reverse without human help?

- If no, prefer Level 0-2.
- If yes, consider Level 3 or Level 4.

## Level 0: Solo Task

Use for bounded work one capable agent can finish directly.

Typical examples:

- answer a code question;
- make a small docs edit;
- run a simple local command;
- fix a narrow bug with obvious tests.

Typical process:

- one agent reads enough context;
- agent implements or answers;
- agent reports result and verification.

Avoid adding peers, overseers, gates, or evidence packets unless the task reveals real risk.

## Level 1: Peer Collaboration

Use when two agents can improve quality by comparing notes or co-drafting.

Skill examples:

- `peer-collaboration`;
- `peer-superset`.

Typical process:

- each peer reviews or drafts independently when useful;
- peers exchange findings;
- one consensus artifact or final answer is produced.

Use for writing, planning, critique, and moderate ambiguity. Do not add quartet or gatekeepers just because two agents disagree; use judgment.

## Level 2: Team Collaboration

Use when the work benefits from explicit roles such as Lead, Reviewer, Breaker, and Verifier.

Skill examples:

- `ready-rock-quartet`;
- `dev-collaboration`.

Typical process:

- lead owns implementation and coordination;
- reviewer checks clarity and correctness;
- breaker looks for failure modes;
- verifier checks the work against the spec.

Use for larger docs/code changes, multi-file implementation, or work where adversarial review is valuable. Keep the artifact and review path concrete.

## Level 3: Overseen Sprint

Use for longer autonomous work where a team may stall, drift, or need periodic liveness checks.

Skill examples:

- `sprint-overseer` plus a Level 2 team pattern.

Typical process:

- sprint spec defines purpose, scope, success criteria, and human-only decisions;
- overseer periodically checks progress and nudges real stalls;
- closeout records what changed and what remains.

If overseers, timers, watchers, or other long-running supervisor processes are used, include a supervisor exit contract: watched files, exact done/stop markers, who writes them, and how termination is verified.

## Level 4: Gatekeeper Sprint

Use for high-value, mission-critical, sensitive, public, or hard-to-reverse work.

Skill examples:

- `gate-keeper`;
- `sprint-overseer`;
- `ready-rock-quartet`.

Not every Level 4 sprint needs every example skill. Choose the safety rails that match the actual risk.

Typical process:

- sprint spec defines gates and approval policy;
- high-risk actions have rollback or recovery evidence;
- gatekeepers approve only the gates that truly need delegated human judgment;
- final human-only decisions remain explicit.

Use for live deploys, production data changes, credentials, spend, destructive actions, or public-facing work where a wrong move has meaningful consequences.

## Skill Boundary

SKILLS describe reusable collaboration patterns. Sprint specs and templates decide which patterns to combine, what gates exist, what evidence is proportionate, and which human boundaries apply for that sprint.

Do not put sprint-specific gate tables, evidence regimes, or one project owner's preferences into general-purpose SKILLS. Put those in the sprint spec.
