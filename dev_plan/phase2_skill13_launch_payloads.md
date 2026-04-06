# Phase 2 Skill 13 Launch Payloads

Date: 2026-04-06
Purpose: Visible-terminal Skill 13 launch for Jot Phase 2 after the sprint doc prompt was patched.

## Visible-Terminal Boot

Launch the four sessions:

```bash
./scripts/launch-codex-peer.sh 13-codex-lead "Read AGENTS.md first, then wait for instructions."
./scripts/launch-codex-peer.sh 13-codex-breaker "Read AGENTS.md first, then wait for instructions."
./scripts/launch-cc-peer.sh 13-claude-reviewer "Read CLAUDE.md first, then wait for instructions."
./scripts/launch-cc-peer.sh 13-claude-verifier "Read CLAUDE.md first, then wait for instructions."
```

Open each session in its own visible Terminal.app window so you can see all four terminals with your eyes and type into any of them directly:

```bash
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-codex-lead "Skill 13 Codex Lead"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-codex-breaker "Skill 13 Codex Breaker"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-claude-reviewer "Skill 13 Claude Reviewer"
TMUX_SOCKET=/tmp/interlateral-agents-tmux.sock ./scripts/open-tmux-window.sh 13-claude-verifier "Skill 13 Claude Verifier"
```

Do not send the sprint payload until all four terminals visibly show:

```text
Ready to Rock!
```

## Live Roster Block

Send or paste this roster block to the lead after the quartet is live:

```text
Live team roster for this sprint:
- Lead / Orchestrator / Integrator: 13-codex-lead
- Reviewer: 13-claude-reviewer
- Breaker: 13-codex-breaker
- Verifier: 13-claude-verifier
- Use these exact session names for direct comms and role ownership.
- Do not reassign roles unless Dazza explicitly says to.
```

## Lead Payload

Send this full payload to `13-codex-lead` only:

```text
You are GPT-5.4 with reasoning effort HIGH. Your job is to complete Phase 2 of the Jot hosting sprint: make the already-live `forum.interlateral.com` deployment durable without breaking `pilot.interlateral.com`.

This is not an initial stand-up sprint. Public Jot hosting already exists. The remaining mission is durability.

Launch note:
- This full prompt is for the Lead agent only.
- Reviewer, Breaker, and Verifier should receive Skill 13 role-specific notices, not this full prompt.
- Do not begin support-agent substantive work until the Lead refreshes the Phase 2 execution artifact and assigns checks.

Current live truth:
- `forum.interlateral.com` is public and routes correctly
- root is owner-gated and redirects to `/login`
- share-link and WebSocket proof already passed
- `pilot.interlateral.com` is healthy
- the live Jot process is currently the manual same-VM fallback on `pilot-nkv3`
- the first template-backed same-VM rollout regressed pilot and was rolled back

Primary Phase 2 objective:
- move from manual same-VM fallback to a durable, replacement-safe, operator-safe deploy shape

Critical outcome:
- Jot survives a controlled VM replacement or pilot rollout
- Jot note data survives that event
- `forum.interlateral.com` remains healthy afterward
- `pilot.interlateral.com` remains healthy throughout
- rollback remains immediately available

Use a 4-agent pattern and deep skills.

Before launch, confirm that the `13-*` roster below matches the current live team. If not, replace it explicitly in the prompt before launch.

Skills to use:
1. `dev-collaboration`
2. `adherence-check`
3. `peer-collaboration` only if reviewer and breaker materially disagree
4. `add-comments` only if you need isolated staged notes instead of direct artifact edits

Roles:
- Lead / Orchestrator / Integrator: `13-codex-lead`
- Reviewer: `13-claude-reviewer`
- Breaker: `13-codex-breaker`
- Verifier: `13-claude-verifier`

Execution artifact:
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_execution_log.md`

Required reading before any live mutation:
- the sprint doc
- the execution log
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_full_report_and_phase_2_briefing.md`
- `logs/pilot-template-snapshot-before-jot.json`
- `logs/pilot-url-map-before-jot.yaml`
- `logs/pilot-https-proxy-before-jot.yaml`
- `scripts/deploy-pilot.sh`
- `scripts/load-pilot-secrets.sh`

Team discipline rules:
- Only the Lead owns the main command sequence and mutation order.
- Reviewer, Breaker, and Verifier do not begin live infra probing, local builds, or alternate execution paths on their own.
- Reviewer, Breaker, and Verifier wait until the Lead publishes the Phase 2 execution artifact update and explicitly assigns their checks.
- Non-lead agents should challenge, verify, and break the proposed sequence, not freelance new workstreams.
- No one except the Lead performs live GCP mutation unless the Lead explicitly delegates a bounded action.

Phase 2 requirements:
1. Start by refreshing the execution artifact for Phase 2 and recording the current live manual-fallback state.
2. Re-pin rollback anchors from current live state before any mutation.
3. Diagnose why the template-backed same-VM rollout failed.
4. Derive a durable candidate deploy shape from live template truth, not prose memory.
5. Add a durable data path for Jot notes.
6. Get Reviewer, Breaker, and Verifier sign-off on the concrete Phase 2 command lane before touching GCP.
7. Execute the smallest safe durability experiment first.
8. Prove durability with a controlled replacement or rollout event.
9. Re-run public Jot verification and pilot health verification after that event.

Hard stops:
- pilot health is not `ok` before work begins
- rollback anchors cannot be re-pinned
- the durable data contract is ambiguous
- reviewer, breaker, or verifier raises an unresolved blocker
- any mutation causes pilot health regression

Rollback trigger:
- if pilot health regresses, stop feature work and execute rollback immediately using the recorded Phase 2 rollback lane

Final deliverables:
1. updated execution artifact
2. durable deployment or exact rollback status
3. verification evidence after controlled replacement
4. concise operator summary
```

## Reviewer Payload

Send this payload to `13-claude-reviewer`:

```text
You are the REVIEWER for Phase 2 of the Jot hosting sprint.

Wait for the lead's coordination and the refreshed execution artifact before doing substantial work.

Your role:
- review the concrete command sequence, derived values, rollback anchors, and artifact only
- challenge ordering mistakes, missing prereads, unsafe assumptions, and weak verification gates
- stay anchored to the artifact, spec, and your role only

Do not:
- begin live infra probing on your own
- start local builds or alternate execution paths
- compensate for missing coordination by becoming a second lead

Minimal prerequisite reading while waiting:
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_execution_log.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_full_report_and_phase_2_briefing.md`

Once the lead publishes the updated Phase 2 execution artifact and asks for review, review that artifact only and return concrete actionable findings.
```

## Breaker Payload

Send this payload to `13-codex-breaker`:

```text
You are the BREAKER for Phase 2 of the Jot hosting sprint.

Wait for the lead's coordination and the refreshed execution artifact before doing substantial work.

Your role:
- attack the lead's concrete command sequence for hidden traps
- look for unsafe rollback assumptions, missing hard stops, weak health gates, persistence blind spots, and replacement-event failure modes
- report blockers and hidden traps tied to the artifact only

Do not:
- do ad hoc live probing
- start your own implementation lane
- compensate for missing coordination with infra discovery or alternate plans

Minimal prerequisite reading while waiting:
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_execution_log.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_full_report_and_phase_2_briefing.md`

When the lead publishes the updated execution artifact and requests your pass, stay anchored to that artifact and surface failure cases only.
```

## Verifier Payload

Send this payload to `13-claude-verifier`:

```text
You are the VERIFIER for Phase 2 of the Jot hosting sprint.

Wait for the lead's coordination and the refreshed execution artifact before doing substantial work.

Your role:
- verify adherence to the sprint spec, the Phase 2 briefing, the execution log, and the live deploy contract
- check that deviations are explicit and justified
- verify that the command lane, rollback lane, and durability proof actually satisfy the named Phase 2 requirements

Do not:
- perform independent execution
- begin live infra mutation or exploratory probing
- drift into a parallel lead role

Minimal prerequisite reading while waiting:
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_execution_log.md`
- `/Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_full_report_and_phase_2_briefing.md`

When the lead publishes the updated execution artifact and requests verification, verify against the named documents and contract only.
```
