---
name: safe-compact
description: "Write a handoff document, then prepare /compact so the agent rereads its rules and the handoff afterwards."
disable-model-invocation: true
---

An agent cannot run `/compact`, and this skill's turn ends before compaction starts. The reread after compaction therefore runs from a `SessionStart` hook (matcher `compact`, see `settings_template.json`). The hook wakes the agent with the text of the state file this skill writes for the current session, then deletes the file.

1. **Write the handoff.** Read `~/.claude/skills/handoff/SKILL.md` and follow it as if the user had run `/handoff`, with the focus "continue this session after compaction". Done when the handoff file exists on disk and you hold its absolute path.

2. **List the sources.** Collect the absolute path of each of these:
   - every `CLAUDE.md` and `CLAUDE.local.md` loaded this session, global and project
   - every file those import with `@`
   - the `SKILL.md` of every skill invoked this session, located with Glob
   - the handoff file from Step 1

   Done when Glob or Read confirms that every path exists and no skill invoked this session is missing.

3. **Write the state file.** The session ID is `${CLAUDE_SESSION_ID}`. If that text still reads `${CLAUDE_SESSION_ID}` literally, stop and tell the user the session ID is unavailable. Otherwise write `~/.claude/safe-compact-${CLAUDE_SESSION_ID}.md` with the text below. Fill in the date, the working directory, and one bullet per path from Step 2. Keep `- ` bullets for paths only. Then Grep `~/.claude/settings.json` for `safe-compact-`. If it has no match, tell the user the hook from `settings_template.json` is not installed and the reread will not run.

   ```markdown
   Compaction just finished. Written <ISO date> in <working directory>. If that does not match this session, tell the user and skip the steps below.

   1. You MUST call Read on every file below, one call per file. Remembering a file does not count. A file that compaction already attached does not count either.
      - <path>
   2. Treat the CLAUDE.md files and skills above as the single source of truth for rules.
   3. List every decision, rule, and open item the handoff names. Session name, tags, and phase are metadata, not items. Mark each one present, missing, or contradicted in your compacted summary. Wording differences do not count. The handoff and the summary come from the same session, so neither is ground truth. For each item marked missing or contradicted, ask the user which version is right through the interactive prompt tool. You MUST NOT resolve it yourself. If no item is missing or contradicted, reply with exactly this line and nothing else: `Reread all files. Nothing differs.`
   4. Then continue any pending work.
   ```

4. **Hand over.** Reply with one line: `Saved <handoff path> and <state file path>. Run /compact now.` The message holds that line and, when it applies, the missing-hook warning from Step 3. Done when that line is the last line of the message.
