# Sprint Process Levels

Process levels are guides, not achievement levels or mandatory gates. Use the lowest level that fits the actual risk, and downgrade or upgrade when evidence shows the work is simpler or riskier than expected.

## Quick Risk Test

Would a wrong action affect production users, mutate live data, spend money, expose credentials, or be hard to reverse without human help?

- If no, prefer Level 0-2.
- If yes, consider Level 3 or Level 4.

## Control Plane Helper Mapping

Most tasks do not need these helpers. Use them when they match the actual risk,
and keep them advisory unless a sprint spec, approval policy, or gate request
explicitly makes one required.

| Helper | Typical level | Use when | Boundary |
| --- | --- | --- | --- |
| `credential-hygiene-lint.js` | Any level when credential material is touched; especially Level 2+ or autonomous work | Scripts, prompts, runbooks, gate packets, helper code, or docs mention credentials, tokens, secret stores, cloud auth, or auth headers. | Conservative local line-pattern guard only. It does not read environment values, secret stores, cloud services, 1Password, Secret Manager, GCP, Cloudflare, credential files, or prove semantic data flow is safe. |
| `gate-packet-lint.js` | Level 3-4 when a strict packet contract is adopted | Formal delegated gates or high-risk mutation approvals that use the script's packet schema. | Checks a strict gate-packet field/content contract. It does not prove delegation authority, evidence freshness, hash truth, command safety, rollback quality, proxy independence, or human approval. |
| `watcher-control-sim.js` | Level 3-4 when overseer classification logic changes | Overseer stall, false-green, retry-loop, or review-spiral thresholds are changed or calibrated. | Exercises local classification examples only. It does not inspect a live timer, manager session, worker session, evidence directory, heartbeat loop, injection path, or stop condition. |
| `identity-direct-send-compat.js` | Any level when transport proof needs extra scrutiny | Transport is fresh, uncertain, desktop-joined, high-risk, or direct-send/ledger helpers changed. | Validates already-captured receiver and ledger evidence for nonce, sender, session id, and target after a direct send. It does not send the message, capture a pane, prove the peer is idle, or prove ongoing transport health. |

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

Use when selected peers can improve quality by comparing notes, independently researching, or co-drafting.

Skill examples:

- `peer-collaboration`;
- `peer-superset`;
- `peer-synthi` for independent research or proposals with material alternatives.

Typical process:

- each peer reviews or drafts independently when useful;
- peers exchange findings;
- one usable artifact or final answer is produced, preserving material alternatives when the task calls for them.

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
