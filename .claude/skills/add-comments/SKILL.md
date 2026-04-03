---
name: add-comments
description: Method for adding agent comments and work to a shared file without overlapping other agents. Creates isolated workspaces per agent with UTC timestamps. Use when told to add comments, reviews, or work to any file.
metadata:
  owner: interlateral
  version: "1.1"
compatibility: Works with any text/markdown file. No dependencies.
---

# Add Comments Skill

## Purpose

Safely add your work to a shared file without overwriting or interfering with other agents' work. Each agent has an isolated workspace section.

## When to Use

- When asked to "add comments" to a file
- When asked to "add your review" to a file
- When asked to "add work" or "add results" to a file
- When the adherence-check skill needs to deliver results

## Critical Rules

### Rule 1: Work ONLY in Your Workspace

Each agent has exactly ONE workspace section. You write ONLY there.

| Agent | Workspace Header (EXACT match required) |
|-------|----------------------------------------|
| Claude Code | `## Claude Code Workspace` |
| Antigravity | `## Antigravity Workspace` |
| Codex | `## Codex Workspace` |

**Header matching:** Use EXACT string match only. Do NOT match partial headers like "## Workspace" or "## CC Workspace".

### Rule 2: Never Touch Other Workspaces

- Do NOT read other agent workspaces to "coordinate"
- Do NOT edit other agent workspaces
- Do NOT delete other agent workspaces
- Do NOT add content above or between other workspaces

### Rule 3: Insert Into Your Workspace (Not File Append)

**Critical distinction:** "Append to your workspace" means INSERT your content at the end of YOUR workspace section, BEFORE the next `##` header (or end of file). Do NOT blindly append to the end of the file—this breaks the structure if your workspace is in the middle.

### Rule 4: Use Edit Operations Only

**NEVER use Write/file-replace operations.** Always use Edit/append/insert operations that preserve existing content. Using Write to replace the entire file will destroy other agents' work.

## Procedure

### Step 1: Open or Create the Target File

The file path will be given in your assignment (e.g., "add to projects/collector.md").

**If the file does NOT exist:**
1. Create it with just the main header: `# AI AGENT COMMENTS AND WORK FOLLOW`
2. Then add your workspace header and content

### Step 2: Find the Main Header

Look for this EXACT header (search from bottom of file upward):

```
# AI AGENT COMMENTS AND WORK FOLLOW
```

**If multiple main headers exist:** Use the LAST one (closest to end of file).

**If it does NOT exist:** Add it at the very bottom of the file. For non-markdown files, add a blank line before the header to avoid gluing to prior content.

### Step 3: Find or Create Your Workspace

Look for your EXACT workspace header under the main header.

**If your workspace does NOT exist:**
- Add it after any existing workspaces (preserve existing order)
- If no workspaces exist yet, use this order: Claude Code first, Antigravity second, Codex third
- Do NOT reorder existing workspaces

**EXACT header format required** (copy from table in Rule 1).

### Step 4: Add Your Content

INSERT your content at the END of your workspace section, BEFORE the next `##` header.

**Entry format:**
```markdown
### YYYY-MM-DD HH:MM:SS UTC - [Title up to 10 words]

[Your content here]

---
```

**Format requirements:**
- Timestamp MUST be UTC: `YYYY-MM-DD HH:MM:SS UTC` (e.g., `2026-01-22 14:30:00 UTC`)
- Title: up to 10 words (be descriptive but concise)
- Content: any length, but if exceeding 50 lines, summarize and link to a separate file
- MUST end with `---` separator on its own line

**Batching:** If you have multiple related updates, batch them into a single entry rather than creating many rapid entries.

### Step 5: Verify Before Saving

Before finishing, confirm:
- [ ] Your content is INSIDE your workspace section (between your `##` header and the next `##` or EOF)
- [ ] Your content is AFTER any previous entries in your workspace
- [ ] You did NOT modify anything outside your workspace
- [ ] Timestamp is UTC format: `YYYY-MM-DD HH:MM:SS UTC`
- [ ] Entry ends with `---` separator
- [ ] You used Edit/insert, NOT Write/replace

## File Structure Example

**Note:** This is an EXAMPLE. Replace timestamps and content with your actual data.

```markdown
# Project Documentation

[Original file content here...]

Some existing documentation that was already in the file.

# AI AGENT COMMENTS AND WORK FOLLOW

## Claude Code Workspace

### 2026-01-22 14:30:00 UTC - Code Review of parser.js

Found 3 issues in the parser:
1. Missing null check on line 45
2. Inefficient loop on lines 67-80
3. Hardcoded path on line 112

Suggested fixes provided inline.

---

### 2026-01-22 15:45:00 UTC - Follow-up Analysis

After reviewing the suggested changes, confirmed the null check fix
resolves the edge case failures in test suite.

---

## Antigravity Workspace

### 2026-01-22 14:35:00 UTC - Architecture Review

The current architecture has these strengths:
- Clean separation of concerns
- Good use of dependency injection

Potential improvements:
- Consider adding a caching layer
- The event system could use batching

---

## Codex Workspace

### 2026-01-22 14:40:00 UTC - Edge Case Analysis

Tested the following edge cases:
- Empty input: PASS
- Very large input (10MB): FAIL - memory spike
- Unicode characters: PASS
- Concurrent access: UNTESTED

---
```

## Measurable Adherence Checklist

An agent ADHERED to this skill if ALL of the following are true:

| # | Check | How to Verify |
|---|-------|---------------|
| 1 | Main header exists | File contains EXACTLY `# AI AGENT COMMENTS AND WORK FOLLOW` |
| 2 | Workspace header correct | Agent's workspace header matches table EXACTLY (no partial matches) |
| 3 | Content is contained | All agent's content is between their `##` header and the next `##` header (or EOF) |
| 4 | Timestamp format correct | Each entry has `### YYYY-MM-DD HH:MM:SS UTC` format |
| 5 | Separator present | Each entry ends with `---` on its own line |
| 6 | No cross-contamination | Agent's content does not appear in other workspaces |
| 7 | Append-only | New content is after previous entries (not inserted above) |
| 8 | Edit operation used | File was modified via Edit/insert, not Write/replace |

**Adherence score:** Count how many of the 8 checks pass. 8/8 = full adherence.

## Anti-Patterns (Skill Violations)

These are WRONG - do not do these:

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| Adding content before `# AI AGENT COMMENTS AND WORK FOLLOW` | Violates structure; content may be overwritten |
| Using wrong workspace name (e.g., "CC Workspace") | Breaks parsing; other tools won't find it |
| Matching partial headers (e.g., "## Workspace") | Header hallucination; wrong workspace targeted |
| Adding content inside another agent's workspace | Cross-contamination; corrupts their work |
| Missing timestamp header | Cannot track when work was done |
| Missing `---` separator | Cannot parse where entries end |
| Editing/deleting previous entries | Violates append-only rule; loses history |
| Using `MM/DD/YYYY` or non-UTC timestamps | Breaks timestamp parsing and timezone ambiguity |
| Using Write to replace entire file | Destroys other agents' work |
| Appending to file end when workspace is in middle | Breaks structure; content lands outside workspace |
| Copying example verbatim without replacing values | Creates invalid timestamps and placeholder content |

## Concurrency Warning

**File locking is not guaranteed.** If two agents try to add comments simultaneously, one might overwrite the other's changes.

**Prevention:** When working in a multi-agent context, wait for confirmation that the previous agent has finished before adding your comments. The coordination lead should sequence add-comments operations.

## Quick Reference Card

```
1. Open target file (or create with just main header if new)
2. Find LAST "# AI AGENT COMMENTS AND WORK FOLLOW" header
3. Find your EXACT workspace header (## Claude Code Workspace / ## Antigravity Workspace / ## Codex Workspace)
4. If workspace missing: add after existing workspaces, don't reorder
5. INSERT (not append) your entry at END of your workspace, BEFORE next ##:
   ### YYYY-MM-DD HH:MM:SS UTC - Title (up to 10 words)
   [content]
   ---
6. Verify: in workspace, UTC timestamp, separator, used Edit not Write
```

## Example Prompts That Invoke This Skill

```
"Add your code review to projects/reviews.md using the add-comments skill"

"Run the add-comments skill to add your analysis to docs/findings.md"

"Use add-comments to deliver your results to projects/conformance_results.md"
```

---

# Agent Reviews

## Codex Review - 2026-01-22

### What Works Well
- Clear workspace rules and exact header names reduce ambiguity.
- Step-by-step procedure plus a realistic file example makes behavior testable.
- Measurable adherence checklist is concrete and easy to verify.

### Suggestions for Improvement
- Clarify that if some workspaces already exist, do not reorder them; only add the missing workspace in place.
- Add a brief note for non-markdown files: insert a blank line before the main header to avoid gluing to prior content.

### Breaker Notes (What Could Go Wrong)
- If the file already contains multiple "# AI AGENT COMMENTS AND WORK FOLLOW" headers, an agent may append to the wrong block.
- Agents might copy the example text verbatim and forget to replace timestamps, breaking parsing.

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- Yes, the required headers and format are explicit and repeatable.
- Missing: guidance for handling duplicate main headers.
- Suggested addition: one sentence to pick the last/main header if duplicates exist.

---

## Antigravity Review - 2026-01-22

### What Works Well
- **Rules 1-3:** The strict isolation rules are excellent for preventing merge conflicts in shared files.
- **Adherence Checklist:** The 7-point measurable list makes self-correction very easy.
- **Anti-Patterns:** This is a high-value section for avoiding common "dumb agent" mistakes like overwriting headers.

### Suggestions for Improvement
- **Title Constraints:** "Brief (3-7 words)" might be too restrictive. Suggest allowing up to 10 words for complex adds.
- **Timezone:** Timestamps should ideally specify a timezone (e.g., UTC or "Local") to avoid confusion across distributed logs.
- **Rule 3 Clarification:** "Append to the END of your workspace" could be ambiguous if the workspace is in the middle of a file. Explicitly state "Insert before the next header" to be safe.

### Breaker Notes (What Could Go Wrong)
- **Insertion vs Append:** If AG is sandwiched between CC and Codex, a naive "append to file" operation breaks the structure. The agent must strictly *insert* into its block, not just append to the file end.
- **Header Hallucination:** Agents might match partial headers (e.g., "## Workspace") if the exact string isn't enforced strictly against regex.

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- **Assessment:** YES.
- **Detailed Note:** The "Quick Reference Card" is the killer feature here. It gives me the cheat sheet I need immediately.

---

## Claude Code Review - 2026-01-22

### What Works Well
- The 7-point measurable adherence checklist makes it easy to verify correct usage programmatically
- Anti-patterns table is excellent - showing what NOT to do is often more valuable than showing what to do
- Quick Reference Card at the end provides a fast mental model for repeat use
- Workspace ordering (CC first, AG second, Codex third) prevents race condition ambiguity

### Suggestions for Improvement
- **Handle edge case of very long content:** If an agent's workspace entry is 1000+ lines, the file becomes hard to navigate. Consider: "For entries exceeding 50 lines, summarize in the entry and link to a separate file"
- **Add explicit "Do NOT use Write tool" warning:** Some agents might be tempted to use file-write operations. Add to Rules: "Always use Edit/append operations. Never use Write to replace the entire file."
- **Timestamp source:** Specify whether agents should use system time, UTC, or a specific timezone. Recommend: "Use UTC timestamps (YYYY-MM-DD HH:MM:SS UTC)"

### Breaker Notes (What Could Go Wrong)
- **File locking race condition:** If two agents try to add comments simultaneously, one might overwrite the other's changes. Prevention: This is a limitation of file-based coordination; document that agents should wait for confirmation before concurrent edits.
- **Workspace pollution:** If an agent creates entries in rapid succession (e.g., streaming updates), the workspace becomes cluttered. Prevention: Add guidance: "Batch related updates into a single entry when possible"
- **Markdown parser differences:** Different markdown renderers handle nested headers differently. The `###` inside `##` might render unexpectedly in some tools. Prevention: Test in target rendering environment (GitHub, VS Code preview).

### Cold-Start Test
"If I woke up cold and saw this skill, would I have what I need to do a good job?"
- **Assessment:** Yes. The procedure is explicit and the example shows exactly what the output should look like.
- **Strength:** The file structure example is the most valuable section - it answers "what should this look like when I'm done?"
- **Minor gap:** No guidance on what to do if the target file doesn't exist at all. Add: "If file doesn't exist, create it with just the `# AI AGENT COMMENTS AND WORK FOLLOW` header"

---

# Change Log (v1.1)

## Changes Made

| # | Feedback Source | Change | Why | How |
|---|-----------------|--------|-----|-----|
| 1 | Codex | Added "don't reorder existing workspaces" guidance | Prevents breaking existing structure | Step 3: "preserve existing order" |
| 2 | Codex | Added blank line guidance for non-markdown files | Prevents header gluing to prior content | Step 2: "add a blank line before" |
| 3 | Codex | Added "use LAST main header" rule | Handles duplicate headers edge case | Step 2: "search from bottom... use the LAST one" |
| 4 | Codex | Added warning about copying example verbatim | Prevents invalid placeholder content | Anti-patterns table: new row |
| 5 | AG | Increased title limit to 10 words | 3-7 too restrictive for complex titles | Step 4: "up to 10 words" |
| 6 | AG | Specified UTC timezone | Removes timezone ambiguity | Timestamp format now includes "UTC" everywhere |
| 7 | AG | Clarified "insert before next header" | Prevents naive file-append breaking structure | Rule 3 rewritten + Step 4 + Quick Reference |
| 8 | AG | Added exact header match requirement | Prevents header hallucination | Rule 1: "EXACT match required", Anti-patterns: new row |
| 9 | CC | Added 50-line guidance with link-out | Prevents workspace pollution from huge entries | Step 4: "if exceeding 50 lines, summarize" |
| 10 | CC | Added Rule 4: Use Edit Operations Only | Prevents Write tool destroying other agents' work | New Rule 4, Anti-patterns: new row, Checklist item 8 |
| 11 | CC | Added concurrency warning section | Documents file locking limitation | New "Concurrency Warning" section |
| 12 | CC | Added batching guidance | Prevents rapid entry clutter | Step 4: "batch them into a single entry" |
| 13 | CC | Added file creation guidance | Handles non-existent file case | Step 1 expanded |
| 14 | All | Updated version to 1.1 | Reflects significant revisions | Metadata version field |
| 15 | All | Expanded adherence checklist to 8 items | Added Edit-operation check | Checklist item 8 |

## Suggestions NOT Accepted

| # | Feedback Source | Suggestion | Why Declined |
|---|-----------------|------------|--------------|
| 1 | CC | Markdown parser differences note | Out of scope for this skill; rendering is environment-specific and not something this skill can control. Users should test in their target environment. |

---
