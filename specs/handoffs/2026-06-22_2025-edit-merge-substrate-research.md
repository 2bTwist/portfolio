---
date: 2026-06-22T20:25:00Z
git_commit: a76c5c8
branch: perf-harness
repository: portfolio
topic: "Agentic-stack principle audit -> picking edit/merge substrate as a research target; next = /first-principles then /rigor"
tags: [handoff, research, edit-merge-substrate, agentic-stack]
status: in-progress
last_updated: 2026-06-22
type: handoff
---

# Handoff: Edit/merge substrate research (post stack-audit)

## Task(s)
- DONE: Built a mental-model framework of core engineering principles (statelessness, coupling,
  SoT, idempotency, code/data separation, etc.) and the diagnostic lens (blast radius).
- DONE: Full-stack principle audit of agentic coding (harness -> CPU), two research fan-outs
  (current-state, then SOTA-fixes), plus a Durable Objects / Durable Execution explainer.
  All synthesized and written to `specs/research/2026-06-22-agentic-stack-principle-audit.md`.
- DONE: Triaged every bottleneck into Good / Workable / Patched, surfaced 5 research targets.
- DONE: User chose the research target = **the edit/merge substrate** (via AskUserQuestion).
- PLANNED (next): `/first-principles` workup of the edit/merge substrate, then `/rigor`.

## Critical References
- `specs/research/2026-06-22-agentic-stack-principle-audit.md` - the whole audit + SOTA fix
  tables + 4-bucket verdict + corrections + sources. READ Layer 4 + section 5 (L4) + section 7.
- Memory: `~/.claude/projects/-Users-edmond-Projects-portfolio/memory/agentic-stack-audit.md`
  (and its MEMORY.md index line).

## Recent changes
- New file: `specs/research/2026-06-22-agentic-stack-principle-audit.md` (the audit; ASCII-only
  glyphs so it renders in any editor: `#`/`Y`/`N`/`~` instead of heat-bars/checkmarks).
- New memory: `agentic-stack-audit.md` + MEMORY.md index updated.
- NOTE: the working tree has unrelated pre-existing staged deletions/mods (portfolio rebuild in
  progress) - NOT mine, do not touch. My only changes this session are the two docs above.

## Learnings (the decision and the why)
- **Chosen target: edit/merge substrate.** Decision rule used: target where today's solution is
  a PATCH over a wrong abstraction AND a small team can move it AND it is measurable. Edit-apply
  wins on all three.
- **Why edit-apply is "patched, not solved":** the primitive is a positional text diff applied
  by exact string match; it violates idempotency + coupling + determinism + contract
  simultaneously; the industry "fix" (fast-apply models like Morph/Relace, ~96-98% vendor-claim)
  is a whole extra model bolted on to MASK a bad primitive.
- **Key nuance / correction (do not forget):** the ~70-85% real-world apply rate is NOT an
  irreducible ceiling. Diff-XYZ (arXiv:2510.12487) shows Claude 4 hits **0.95 apply on
  structured unified-diff vs 0.57 on search-replace** in isolation. So raw accuracy is rising on
  its own. The durable contribution must therefore be **idempotency (safe re-apply)** and
  **silent-failure detection / semantic-validity verification**, NOT chasing the accuracy number.
- **The unattacked principle across L4:** every "win" replaces a LOUD failure (conflict marker,
  lock error) with a SILENT plausible-wrong result. Semantic-validity verification of the
  applied/merged result is the genuinely unaddressed gap.
- **Ruled out as first targets (with reasons):** code/data-separation protocol (#4, partly
  lab-owned, overlaps CaMeL); orchestration semantics (#5, vague, benchmark-resistant); semantic
  CRDT for code (#3, most novel but highest research risk / longest). Agent-memory provenance+
  rollback (#2) was the strong runner-up if a security framing is later preferred.

## Artifacts
- `specs/research/2026-06-22-agentic-stack-principle-audit.md`
- `~/.claude/projects/-Users-edmond-Projects-portfolio/memory/agentic-stack-audit.md`

## Action Items & Next Steps
1. Run **`/first-principles`** on the edit/merge substrate. Carry this framing verbatim:
   > First-principles re-framing of the agent **edit/merge substrate**. Incumbent: positional
   > text diffs (unified-diff / search-replace) applied by exact string match, with fast-apply
   > models bolted on to mask failures. Assumptions to question: that an edit is a *positional*
   > delta against exact bytes; that apply is best-effort string matching; that non-idempotency
   > is acceptable; that "it applied" implies "it is semantically valid." Primitive to rebuild:
   > an **idempotent, structure/anchor-addressed edit representation** with a **semantic-validity
   > gate** (types/scope/refs) on apply and merge. Source: the audit doc, Layer 4 + section 5(L4)
   > + the Diff-XYZ apply numbers + the silent-failure finding.
2. Then **`/rigor`** for the experiment/benchmark design (Diff-XYZ-style apply/anti-apply bench;
   add idempotency + semantic-validity as new metrics; name what you are NOT measuring).
3. Output of first-principles goes to `specs/first-principles/YYYY-MM-DD-<slug>.md`.

## Other Notes
- User profile: builder wanting "proper, not AI slop" open-source contributions; uses Claude to
  stress-test, not validate (no sycophancy). Wants original work, open to a new protocol/standard.
- Context had grown very large across two 6-agent research fan-outs - that is WHY we compacted
  here. Everything load-bearing is on disk (audit doc + memory), so the compact is lossless.
- searxng MCP was DOWN all session (returned empty); agents fell back to WebSearch + primary
  sources. If re-running research, check `~/.config/searxng/README.md` recovery steps first.
- Claude Code was upgraded 2.1.185 -> 2.1.186 mid-session (unrelated).
