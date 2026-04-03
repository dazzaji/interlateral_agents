---
name: create-skin
description: Create a new Skin for the Interlateral Comms Monitor using the dev-collaboration pattern.
metadata:
  owner: interlateral
  version: "1.0"
compatibility: Requires interlateral_comms_monitor UI + dev-collaboration skill.
---

# create-skin

Create a new Skin for the Interlateral Comms Monitor using the dev-collaboration pattern.

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| name | Yes | - | PascalCase name ending in "Skin" (e.g., AgentTimelineSkin) |
| features | Yes | - | Bulleted list of features to implement |
| path | No | interlateral_comms_monitor/ui/src/skins/<name>.tsx | Target file path |
| reviewer_min | No | 3 | Minimum suggestions from Reviewer |
| breaker_min | No | 3 | Minimum failure scenarios from Breaker |

## Prerequisites

Before this skill can run:
1. Courier must be running (repo-scoped check):
   ```bash
   pgrep -f "$REPO_ROOT/interlateral_dna/courier.js" || (cd interlateral_dna && node courier.js &)
   ```
2. Dashboard must be running: `curl -s http://127.0.0.1:5173`
3. Read these docs:
   - `interlateral_comms_monitor/docs/SKIN_DEV_GUIDE.md`
   - `interlateral_comms_monitor/docs/INTERNALS_CONFORMANCE.md`

## Execution Sequence

### Phase 0: Preflight (Safety First)
```bash
# Get repo root
REPO_ROOT=$(git rev-parse --show-toplevel)

# Verify courier is running (repo-scoped to avoid cross-clone collisions)
pgrep -f "$REPO_ROOT/interlateral_dna/courier.js" || \
  (cd "$REPO_ROOT/interlateral_dna" && node courier.js > /tmp/courier.log 2>&1 &)

# Verify dashboard is running (use 127.0.0.1 per conformance)
curl -s http://127.0.0.1:5173 > /dev/null || echo "WARNING: Dashboard not running"
```

### Phase 1: Invoke dev-collaboration (CRITICAL)
**You MUST use the Skill tool to formally invoke dev-collaboration:**
```
[Use Skill tool with skill="dev-collaboration"]
```
Roles:
- CC = Drafter
- AG = Reviewer
- Codex = Breaker

### Phase 2: Draft Creation (CC as Drafter)
1. Create `<name>.tsx` with:
   - `export const meta: SkinMeta` with id, name, description
   - `export default <name>` component accepting SkinProps
   - `containerRef` for scroll handling
   - Dark theme colors per SKIN_DEV_GUIDE
2. Implement all requested features

### Phase 3: Build Validation (Section 7.5)
```bash
cd interlateral_comms_monitor/ui
npx tsc --noEmit && echo "TypeScript: PASS" || echo "TypeScript: FAIL"
npm run build && echo "Build: PASS" || echo "Build: FAIL"
```
**STOP if either fails. Fix before proceeding.**

### Phase 4: T5 Plugin Test (Section 7.6 - Full Steps)
1. Verify file matches `*Skin.tsx` pattern
2. Verify `export const meta` exists
3. Verify `export default` exists
4. **Full T5 verification:**
   ```bash
   # Create TestSkin.tsx
   echo 'export const meta = { id: "test-t5", name: "Test T5" }; export default () => null;' > \
     interlateral_comms_monitor/ui/src/skins/TestSkin.tsx

   # Refresh browser
   osascript -e 'tell application "Google Chrome" to reload active tab of front window'

   # Verify TestSkin appears in dropdown (manual visual check)

   # Remove TestSkin.tsx
   rm interlateral_comms_monitor/ui/src/skins/TestSkin.tsx
   ```
5. Confirm your actual skin appears in dropdown

### Phase 5: Notify Reviewers (Ledger + Whip)
Post to comms.md:
```
[CC] @AG @Codex [TIMESTAMP]
## DRAFT READY: <name> v1.0
Artifact: <path>
Build: PASS | T5: PASS
Ready for review.
---
```

Inject notifications:
```bash
node ag.js send "[CC] @AG - <name> v1.0 ready for review at <path>. Your role: REVIEWER. Post >=3 suggestions."
node codex.js send "[CC] @Codex - <name> v1.0 ready at <path>. Your role: BREAKER. Post >=3 failure scenarios. Use courier outbox."
```

### Phase 6: AG Review (Reviewer Role)
AG must:
1. Read the artifact file directly
2. Check conformance with SKIN_DEV_GUIDE.md
3. Deliver >=3 actionable suggestions:
```
SUGGESTION 1: [Title]
What: [Specific change]
Why: [Benefit]
```
4. Post to comms.md + inject notification to CC
5. Verdict: APPROVE or REQUEST CHANGES

### Phase 7: Codex Review (Breaker Role)
Codex must:
1. Read artifact at explicit path (not rely on injection summary)
2. Identify >=3 failure scenarios:
```
FAILURE 1: [Title]
Attack: [How this could break]
Consequence: [What goes wrong]
Prevention: [How to fix]
```
3. Post to comms.md directly
4. Notify CC via courier outbox:
```bash
echo '{"target":"cc","msg":"[Codex] Breaker review posted to comms.md"}' > interlateral_dna/codex_outbox/$(date +%s).msg
```
5. Verdict: APPROVE or REQUEST CHANGES

### Phase 8: Revision (CC Creates v1.1)
1. Read all feedback from comms.md
2. Implement accepted suggestions
3. Address failure scenarios
4. Add Change Log to the .tsx file:
```tsx
/**
 * ## Change Log (v1.1)
 * - **Fixed:** [What was fixed] (Thanks @AG)
 * - **Hardened:** [What was protected] (Thanks @Codex)
 * - **Declined:** [Suggestion] - [Reason]
 */
```
5. Re-run Phase 3 (build validation)
6. Re-run Phase 4 (T5 test)

### Phase 9: Re-Review
1. Post v1.1 completion to comms.md
2. Request re-approval from AG and Codex
3. If REQUEST CHANGES: return to Phase 8
4. If both APPROVE: proceed to Phase 10

### Phase 10: Final Delivery (Show Human the Skin)
1. Open browser on human's desktop: `open http://127.0.0.1:5173`
2. Tell human: "Select '<name>' from the skin dropdown to see it"
3. Wait for human to visually confirm the skin works
4. Report completion with verification checklist

**NOTE:** The human sees the actual browser - no screenshot needed. AG screenshots are for debugging only, not for final delivery.

## Verification Checklist (Final Report)

```markdown
## Skin Creation Complete: <name>

| Check | Status |
|-------|--------|
| File exists | |
| TypeScript compiles | |
| Build passes | |
| T5 plugin test | |
| Appears in dropdown | |
| AG review (>=3 suggestions) | |
| Codex review (>=3 failures) | |
| Change Log in file | |
| Courier delivered | |

**Artifact:** <path>
**Browser:** Opened for human visual confirmation
```

## Failure Handling

| Situation | Action |
|-----------|--------|
| Build fails | STOP. Fix errors. Do not notify reviewers. |
| T5 fails | STOP. Fix exports. Re-run validation. |
| Courier not running | Start courier before assigning Codex. |
| Reviewer delivers <3 suggestions | Request more before proceeding. |
| Breaker delivers <3 scenarios | Request more before proceeding. |
| 10-minute timeout | Proceed with Partial Revision, note missing input. |

## Templates

### Draft Ready Post
```
[CC] @AG @Codex [TIMESTAMP]
## DRAFT READY: <name> v1.0
Artifact: <path>
Build: PASS | T5: PASS
Ready for review.
---
```

### Completion Post
```
[CC] @AG @Codex @HUMAN [TIMESTAMP]
## SKIN COMPLETE: <name> v1.1
All reviews incorporated. Final approvals received.
Browser opened. Screenshot captured.
[Verification checklist here]
---
```

## How This Skill Composes with dev-collaboration

The `create-skin` skill **wraps** dev-collaboration:

```
create-skin
├── Phase 0: Preflight (unique to create-skin)
├── Phase 1: Invoke dev-collaboration (use Skill tool)
│   ├── CC = Drafter
│   ├── AG = Reviewer
│   └── Codex = Breaker
├── Phase 2-4: Build validation + T5 (unique to create-skin)
├── Phase 5-9: dev-collaboration workflow
└── Phase 10: Open browser for human (unique to create-skin)
```

The skill adds:
- **Preflight checks** (repo-scoped courier, dashboard at 127.0.0.1)
- **Conformance enforcement** (Section 7.5, 7.6 with full T5 steps)
- **Browser delivery** (opens on human's desktop for visual confirmation)
- **Explicit Codex courier instructions**

---

*Skill created by CC with reviews from AG and Codex, 2026-01-23*
*Fixes incorporated: 127.0.0.1, full T5 steps, repo-scoped courier, template delimiters, explicit Skill tool mention*
