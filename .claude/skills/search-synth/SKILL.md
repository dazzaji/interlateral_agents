---
name: search-synth
description: Multi-agent web research with fact-checking and verified synthesis. Each agent searches, writes response, then fact-checks others. Chief author produces final verified response.
metadata:
  owner: interlateral
  version: "1.1"
  weight: heavy
compatibility: Requires 4 agents (manager + 3 searchers). All agents need web search capability.
---

# Search-Synth: Multi-Agent Research with Fact-Checking

## Purpose

Conduct thorough web research on a topic using multiple agents, cross-verify findings through fact-checking, and produce a synthesized "Best and Verified" response.

## Roles

| Role | Agent | Responsibilities |
|------|-------|------------------|
| **MANAGER** | CC (instance 1) | Orchestrates phases, assigns tasks, does NOT search |
| **SEARCHER** | AG, Codex, Gemini | Web search, write expository response, fact-check others |
| **CHIEF_AUTHOR** | CC (default, configurable) | Writes final "Best and Verified" synthesis |

**Note:** CHIEF_AUTHOR can be reassigned via prompt (e.g., `CHIEF_AUTHOR=AG`).

## CLI-Specific Search Methods

Each agent uses its native search capability:

| Agent | Search Tool | Notes |
|-------|-------------|-------|
| **CC** | `brave_web_search` (MCP) | Requires brave-search MCP. Verify: `claude mcp list` |
| **Codex** | `web.run` | Built-in. Must use this tool explicitly for searches |
| **Gemini** | `google_web_search` | Built-in grounding. Use gemini-3-pro for better citations |
| **AG** | Browser-based | Uses Puppeteer/CDP for web access |

**CC Setup (if MCP missing):**
```bash
claude mcp add brave-search -- npx -y @modelcontextprotocol/server-brave-search
```

## Protocol

### Phase 1: Search and Respond

MANAGER assigns topic to all SEARCHERS:

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

After all SEARCHERS signal [PHASE1_DONE], MANAGER assigns fact-checking:

```
[AGENT] - MANAGER here. TASK: Fact-check the other responses.
1. Read the responses from [OTHER_AGENT_1] and [OTHER_AGENT_2]
2. For EACH assertion/claim, verify via web search
3. Add your fact-checks to [OUTPUT_FILE] under "## Fact Checks" → "### [AGENT] Fact-Check of [OTHER]"
4. Format: Claim → Verdict (VERIFIED / FALSE / UNVERIFIABLE) → Source
5. Signal [PHASE2_DONE] when complete
```

Each SEARCHER fact-checks the other two:
- AG fact-checks Codex and Gemini
- Codex fact-checks AG and Gemini
- Gemini fact-checks AG and Codex

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
   - May be true but couldn't be verified from authoritative sources
   - Are widely reported but not officially documented
5. Add to [OUTPUT_FILE] under "## Best and Verified Response"
6. Signal [DONE] when complete
```

## Output File Structure

```markdown
# [TOPIC] Research Synthesis

**Skill:** search-synth
**Date:** [DATE]
**Searchers:** AG, Codex, Gemini
**Chief Author:** CC

---

## Phase 1: Initial Responses

### AG Response
[expository response]

#### AG Search Terms & Raw Results
**Query:** "[search terms]"
| URL | Title/Blurb |
|-----|-------------|
| ... | ... |

### Codex Response
[expository response]

#### Codex Search Terms & Raw Results
...

### Gemini Response
[expository response]

#### Gemini Search Terms & Raw Results
...

---

## Phase 2: Fact Checks

### AG Fact-Check of Codex
| Claim | Verdict | Source |
|-------|---------|--------|
| ... | VERIFIED/FALSE/UNVERIFIABLE | ... |

### AG Fact-Check of Gemini
...

### Codex Fact-Check of AG
...

### Codex Fact-Check of Gemini
...

### Gemini Fact-Check of AG
...

### Gemini Fact-Check of Codex
...

---

## Phase 3: Best and Verified Response

**Chief Author:** CC

[Final synthesized response incorporating all verified information]

### Unverified Claims

The following assertions appear plausible but could not be verified from authoritative sources:

- [Claim 1] — Reported by [source], not officially documented
- [Claim 2] — Widely observed behavior, no authoritative confirmation
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

## Communication

Default: `comms.md` + control scripts (`ag.js`, `codex.js`, `gemini.js`)

## Error Handling & POKE Mechanism

### Timeout with POKE (Preferred)

Instead of immediately abandoning slow agents, MANAGER sends a POKE:

**At 60s (first timeout):**
```
[AGENT] - MANAGER here. POKE: You haven't reported Phase [N] results.
Please complete your search and post findings now.
If blocked, signal [BLOCK] with reason.
```

**At 120s (final timeout):**
- If still no response after POKE: MANAGER signals `[BLOCK]` and proceeds without that agent
- Log: "[AGENT] unresponsive after POKE, proceeding with available agents"

### Other Error Conditions

- If fewer than 2 searchers complete Phase 1: Skill exits with `[INCOMPLETE]`
- If CHIEF_AUTHOR unavailable: MANAGER may reassign to next available agent

### Citation Requirements

All agents must:
- Use proper citations [1] for non-common facts derived from web sources
- Avoid raw markdown links in narrative text — use citation format instead
- Include full URLs only in the "Raw Results" table section

## Example Prompts

### Basic (topic in prompt)
```
Use search-synth to research "What is retrieval-augmented generation (RAG)?"
Output: projects/research/rag-synthesis.md
```

### With work file
```
Use search-synth.
Work: projects/research/quantum-computing/work.md
Output: projects/research/quantum-computing/synthesis.md
```

### With custom chief author
```
Use search-synth to research "History of computational law"
CHIEF_AUTHOR=AG
Output: projects/research/complaw-history.md
```

## Notes

- **No scaffolding code** — This skill relies on well-written instructions, not automation
- **Manager is orchestrator only** — Does not participate in search/fact-check
- **Parallel execution** — Phase 1 searchers work simultaneously
- **Sequential phases** — Phase 2 starts only after all Phase 1 complete
