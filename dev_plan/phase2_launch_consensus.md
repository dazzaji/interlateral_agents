# Phase 2 Launch Consensus

Date: 2026-04-06
Skill: peer-collaboration
Topic: Decide whether the current Phase 2 sprint prompt is ready to run as-is with Skill 13, or whether targeted updates are advisable before launch.

## Participants

- Codex (`PEER_A`)
- Claude (`PEER_B`)

## Working Draft

### Initial Position From Codex

1. The current Phase 2 prompt is materially stronger than the earlier Sprint 3A handoff and is likely sufficient for a capable lead agent.
2. Skill 13 should still be used, because it solves team-formation and anti-drift problems that the sprint prompt does not solve.
3. The most plausible updates, if any, should be narrow launch-hygiene updates rather than mission changes:
   - explicitly tell the lead to confirm the live session names actually match the quartet before dispatch
   - explicitly say the second-part prompt is the payload after the Skill 13 roster lock is complete
   - explicitly keep non-lead agents on minimal prerequisite reading until the lead publishes the refreshed Phase 2 execution artifact

### Response From Claude (PEER_B)

**1. What I would change or add:**

Two targeted additions to the sprint doc's Phase 2 prompt — both are one-liners:

- **Add the briefing doc to required reading.** The prompt says "diagnose why the template rollout failed" but the only doc that carries the actual hypothesis list (COS startup-script ordering, Docker readiness timing, `create-with-container` vs startup-script interaction, registry auth) is `sprint_jot_subdomain_full_report_and_phase_2_briefing.md`. Without it, the lead will spend cycles rediscovering what's already written. Fix: add one line to the "Required reading" block.

- **Add a launch-sequence note at the top of the prompt.** The prompt names four roles but doesn't say "only the Lead receives this prompt; support agents receive role notices only." A cold operator could paste the full prompt into all four terminals. Fix: add 2-3 lines saying this prompt is for the Lead only, and that Reviewer/Breaker/Verifier should receive Skill 13's role-specific notices instead.

That's it. No mission changes, no requirement changes, no restructuring.

**2. Should the Phase 2 prompt run as-is with Skill 13?**

Yes — with those two additions. The prompt is the mission payload. Skill 13 is the launch wrapper. They cover complementary surfaces:

| Prompt covers | Skill 13 covers |
|---|---|
| What to do, in what order | How to boot the team safely |
| Live infra state & required reading | Ready to Rock gate & roster lock |
| Hard stops & rollback triggers | Anti-drift notices per role |
| 9-step execution sequence | Launch contract (who sees what first) |

Neither replaces the other. Use both.

**3. Is any doc update actually needed before launch?**

Yes, but only in one place: the `PROMPT FOR THE SECOND PART OF THIS SPRINT` block inside `sprint_jot_subdomain.md`. Two additions:

```
# Add to the top of the prompt block:
Launch note: this prompt is for the Lead agent only. Reviewer, Breaker, and
Verifier should receive Skill 13 role-specific notices, not this full prompt.

# Add to "Required reading before any live mutation":
- sprint_jot_subdomain_full_report_and_phase_2_briefing.md
```

No other doc needs updating. The briefing, execution log, and sprint doc are all correct and current.

**Codex's three launch-hygiene points are all correct.** I agree with all three. My additions are complementary, not contradictory:
- Codex says "confirm live session names match" — agreed, Skill 13 handles this
- Codex says "prompt is payload after roster lock" — agreed, I'm just saying to make that explicit *in the prompt itself*
- Codex says "keep non-lead agents on minimal reading" — agreed, Skill 13's role notices do exactly this

### Consensus Status

Codex and Claude agree on:
- The Phase 2 prompt is strong and should not be restructured
- Skill 13 should be used as the launch wrapper
- Two narrow additions to the prompt block (briefing doc in required reading + launch-sequence note)
- No mission or requirement changes needed

### Open Questions

1. Does Codex agree these two additions are the right scope, or does Codex see anything else?
2. Should we write the exact updated prompt block as the final deliverable of this artifact?

### Final Response From Codex (PEER_A)

I agree with Claude's scope and do not see any additional required changes.

The right recommendation to Dazza is:

1. Boot the quartet with Skill 13.
2. Keep the current Phase 2 mission and requirement structure unchanged.
3. Make exactly two prompt-block updates before launch:
   - add the Phase 2 briefing doc to required reading
   - add a lead-only launch note so the full prompt is not pasted into support-agent terminals
4. After the Skill 13 `Ready to Rock!` gate and roster lock, send the full Phase 2 prompt only to the lead.
5. Send only role-specific waiting notices to Reviewer, Breaker, and Verifier until the lead publishes the refreshed Phase 2 execution artifact.

### Exact Recommended Prompt Additions

Add this near the top of `PROMPT FOR THE SECOND PART OF THIS SPRINT`, immediately after the opening mission lines:

```text
Launch note:
- This full prompt is for the Lead agent only.
- Reviewer, Breaker, and Verifier should receive Skill 13 role-specific notices, not this full prompt.
- Do not begin support-agent substantive work until the Lead refreshes the Phase 2 execution artifact and assigns checks.
```

Add this line to `Required reading before any live mutation`:

```text
- /Users/dazzagreenwood/Documents/GitHub/interlateral_platform_alpha/docs/2026_04_03_Sesh/sprint_jot_subdomain_full_report_and_phase_2_briefing.md
```

### Final Consensus

- The current Phase 2 prompt is strong and should not be restructured.
- Skill 13 should be used as the launch wrapper.
- Two narrow prompt-block additions are advisable before launch.
- No mission, durability objective, hard-stop, or requirement changes are needed.
- After those two additions, the correct move is to boot the four agents with Skill 13 and apply the updated Phase 2 prompt to the lead only.

## Final Status

```text
SKILL: peer-collaboration
STATUS: DONE
TURNS: 2
OUTPUT: dev_plan/phase2_launch_consensus.md
PARTICIPANTS: Codex (PEER_A), Claude (PEER_B)
```
