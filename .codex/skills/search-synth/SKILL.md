---
name: search-synth
description: Multi-agent web research with cross-fact-checking and verified synthesis.
metadata:
  owner: interlateral
  version: "0.1"
---

# Search-Synth: Multi-Agent Research with Fact-Checking

## Purpose

Conduct thorough web research on a topic using multiple agents, cross-verify findings through fact-checking, and produce a synthesized "Best and Verified" response.

## Required Inputs

| Parameter | Description |
|-----------|-------------|
| `topic` | The research question or subject to investigate. |
| `output_file` | File path where the synthesized result will be written. |
| `agents` | Explicit list of participating agents, with each agent's search capability noted (see below). |

## Agent Roster and Search Capability

The invoker must declare which agents will participate and confirm which ones have web-search capability. Example:

```
agents:
  - name: CC
    role: MANAGER
    can_search: false
  - name: Codex
    role: SEARCHER
    can_search: true
    search_tool: web.run
  - name: Gemini
    role: SEARCHER
    can_search: true
    search_tool: google_web_search
```

### Pre-flight Check (Mandatory)

Before starting any phase, MANAGER must verify the roster:

1. At least two agents must have `can_search: true`.
2. At least one agent must be designated MANAGER (the MANAGER does not search).
3. A CHIEF_AUTHOR must be designated (defaults to MANAGER if not specified).

**If the roster cannot satisfy search requirements -- for example, no agent has web search, or fewer than two searchers are available -- STOP immediately and report the mismatch. Do not improvise, simulate, or pretend to search.**

## Roles

| Role | Responsibilities |
|------|------------------|
| **MANAGER** | Orchestrates phases, assigns tasks, does NOT search. |
| **SEARCHER** | Uses its declared search tool to research, writes expository response, fact-checks peers. |
| **CHIEF_AUTHOR** | Writes the final "Best and Verified" synthesis. Defaults to MANAGER; can be reassigned. |

## Protocol

### Phase 1: Search and Respond

MANAGER assigns the topic to all SEARCHERS:

```
[AGENT] - MANAGER here. TASK: Research "[TOPIC]"

1. Use YOUR search tool to research this topic thoroughly
2. Write a NARRATIVE response (3-5 paragraphs) that:
   - Provides a well-considered, useful, actionable answer
   - Synthesizes findings into coherent prose (NOT just a list of results)
   - Uses proper citations [1] for non-common facts
3. Add your response to [OUTPUT_FILE] under "## [AGENT] Response"
4. BELOW your response, add "### [AGENT] Search Terms & Raw Results" with:
   - Your actual search query
   - URL + Title/Blurb table for each source
5. Signal [PHASE1_DONE] when complete

IMPORTANT: Response must be expository/narrative FIRST, then raw results.
Do NOT provide "next 10" style listings. Synthesize and explain.
```

All SEARCHERS work in parallel.

### Phase 2: Fact-Check

After all SEARCHERS signal [PHASE1_DONE], MANAGER assigns fact-checking. Each SEARCHER fact-checks every other SEARCHER's response:

```
[AGENT] - MANAGER here. TASK: Fact-check the other responses.
1. Read the responses from [OTHER_AGENTS]
2. For EACH assertion/claim, verify via web search
3. Add your fact-checks to [OUTPUT_FILE] under "## Fact Checks" -> "### [AGENT] Fact-Check of [OTHER]"
4. Format: Claim -> Verdict (VERIFIED / FALSE / UNVERIFIABLE) -> Source
5. Signal [PHASE2_DONE] when complete
```

### Phase 3: Best and Verified Synthesis

After all fact-checks complete, MANAGER prompts CHIEF_AUTHOR:

```
CHIEF_AUTHOR - MANAGER here. TASK: Write the "Best and Verified" response.
1. Read ALL responses from Phase 1
2. Read ALL fact-checks from Phase 2
3. Write a comprehensive response that:
   - Captures ALL good/accurate content from each original response
   - EXCLUDES any assertions marked FALSE by fact-checkers
   - Synthesizes into a coherent, authoritative answer
4. Add an "### Unverified Claims" section listing assertions that:
   - May be true but could not be verified from authoritative sources
   - Are widely reported but not officially documented
5. Add to [OUTPUT_FILE] under "## Best and Verified Response"
6. Signal [DONE] when complete
```

## Output File Structure

```markdown
# [TOPIC] Research Synthesis

**Skill:** search-synth
**Date:** [DATE]
**Searchers:** [list of SEARCHER agents]
**Chief Author:** [CHIEF_AUTHOR agent]

---

## Phase 1: Initial Responses

### [Agent A] Response
[expository response]

#### [Agent A] Search Terms & Raw Results
**Query:** "[search terms]"
| URL | Title/Blurb |
|-----|-------------|
| ... | ... |

### [Agent B] Response
...

---

## Phase 2: Fact Checks

### [Agent A] Fact-Check of [Agent B]
| Claim | Verdict | Source |
|-------|---------|--------|
| ... | VERIFIED/FALSE/UNVERIFIABLE | ... |

### [Agent B] Fact-Check of [Agent A]
...

---

## Phase 3: Best and Verified Response

**Chief Author:** [CHIEF_AUTHOR]

[Final synthesized response incorporating all verified information]

### Unverified Claims

The following assertions appear plausible but could not be verified
from authoritative sources:

- [Claim 1] -- Reported by [source], not officially documented
- ...

---

**[DONE]**
```

## Termination Signals

| Signal | Meaning |
|--------|---------|
| `[PHASE1_DONE]` | Searcher completed response + raw results |
| `[PHASE2_DONE]` | Searcher completed fact-checks of others |
| `[DONE]` | Chief author completed final synthesis |
| `[BLOCK]` | Cannot proceed (missing input, agent unresponsive) |
| `[MISMATCH]` | Roster does not satisfy search requirements; skill halted |

## Error Handling

### Search Capability Mismatch

If MANAGER determines that the roster lacks sufficient search capability (fewer than two agents with `can_search: true`), the skill must:

1. Signal `[MISMATCH]`.
2. Report which agents were provided and what capabilities they declared.
3. Halt. Do not attempt to proceed with insufficient search coverage.

### Timeout with POKE

Instead of immediately abandoning slow agents, MANAGER sends a POKE:

**At 60s (first timeout):**
```
[AGENT] - MANAGER here. POKE: You haven't reported Phase [N] results.
Please complete your search and post findings now.
If blocked, signal [BLOCK] with reason.
```

**At 120s (final timeout):**
- If still no response after POKE: MANAGER signals `[BLOCK]` and proceeds without that agent.
- Log: "[AGENT] unresponsive after POKE, proceeding with available agents"

### Other Error Conditions

- If fewer than 2 searchers complete Phase 1: skill exits with `[INCOMPLETE]`.
- If CHIEF_AUTHOR unavailable: MANAGER may reassign to next available agent.

## Citation Requirements

All agents must:
- Use proper citations [1] for non-common facts derived from web sources.
- Avoid raw markdown links in narrative text; use citation format instead.
- Include full URLs only in the "Raw Results" table section.

## Example Prompts

### Basic
```
Use search-synth.
Topic: "What is retrieval-augmented generation (RAG)?"
Output: projects/research/rag-synthesis.md
Agents:
  - CC (MANAGER, no search)
  - Codex (SEARCHER, web.run)
  - Gemini (SEARCHER, google_web_search)
Chief author: CC
```

### Two searchers with explicit capability
```
Use search-synth.
Topic: "History of computational law"
Output: projects/research/complaw-history.md
Agents:
  - CC (MANAGER + CHIEF_AUTHOR, no search)
  - Gemini (SEARCHER, google_web_search)
  - CC-instance-2 (SEARCHER, brave_web_search via MCP)
```

## Notes

- **No scaffolding code** -- this skill relies on well-written instructions, not automation.
- **Manager is orchestrator only** -- does not participate in search or fact-checking.
- **Parallel execution** -- Phase 1 searchers work simultaneously.
- **Sequential phases** -- Phase 2 starts only after all Phase 1 signals are received.
- **Explicit capability** -- never assume an agent can search; the roster must declare it.
