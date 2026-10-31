# ask-context-gate

A hook that stops an agent from asking you a question whose context you cannot see.

## The problem

An agent runs several tools, builds a clear picture, and then asks "Which option?". The picture exists only in its thinking, in collapsed tool output, or in text it wrote between tool calls. Some models return that text as a one-line progress summary, and the original never reaches you. You see a bare question and cannot decide.

Only two surfaces reach you in full: the question payload itself, and assistant text that opens or ends a turn.

## What it blocks

The hook runs before an `AskUserQuestion` call and before a `PromptForUserInput` call. It blocks with a JSON `permissionDecision` of `deny` and exit code 0. Its reason tells the agent how to fix the call.

| Gate | Blocks |
|------|--------|
| G1 | A question or form text that points at unseen context, such as "with that context" or "see above". An option description is not checked when its question (or the form intro) has 200 or more characters, because "above" then points at that text. |
| G2 | The same question text with the same option labels (or the same form) asked again after you answered in free text (an Other answer in a form), dismissed it, or never answered. A repeat after you picked an offered option is allowed. Any other repeat is blocked once, and the agent rewrites the question. G2 looks at the whole session. |
| G3 | A mid-turn question when the payload has fewer than 200 characters of context and fewer than 200 characters of the agent's text reached the transcript since the last tool result. The payload counts question or form text, option labels, descriptions, previews, item titles and starting texts. A question right after your message is exempt. Only tool calls that already have a result count as earlier work, and a question you answered with an offered option does not count, so a series of questions passes. |

The hook fails open. A missing transcript, a malformed line, an unknown payload shape, or any error allows the call.

## Works with

| Harness | Tool name | Status |
|---------|-----------|--------|
| Claude Code CLI | `AskUserQuestion` | Live on CLI 2.1.312, 2.1.314 and 2.1.316: G1, G2 (2.1.316) and G3 block, a long question passes, an error in the hook allows the call. A JSON deny shows a shorter red error than exit code 2. |
| Claude desktop app (Code tab) | `AskUserQuestion` | Live on 2.1.309: G1 and G3. G2 not run. A later G1 test with the JSON deny shows the block as one collapsed "Failed" row, and the agent then asks again. |
| Nimbalyst | `mcp__nimbalyst__AskUserQuestion`, `mcp__nimbalyst__PromptForUserInput` | Live for `AskUserQuestion`: G1, G2 and G3 (G1 again with the JSON deny). Live for `PromptForUserInput`: G1 with the JSON deny. G2 and G3 for forms only in unit tests. |

A replay of 400 older sessions of one user (cut-off 2026-10-30 12:00, 813 forms and 1,339 questions) blocked 4 forms for G3 and 4 for G1, and blocked 3 questions for G3, 1 for G2 and 2 for G1. Nobody checked by hand whether each block was justified.

Any MCP tool named `AskUserQuestion` works if it takes a `questions` array with `question` and `options`. Any MCP tool named `PromptForUserInput` works if it takes `title`, `intro` and a `fields` array.

Nimbalyst shows a blocked question as a "Questions Answered / Submitted" card, and a blocked form as an "Input requested" card that looks open. The agent still receives the block and asks again.

## Install

1. Copy `ask-context-gate.cjs` to `~/.claude/hooks/ask-context/`. If you cloned this repo into `~/.claude`, the file is already there.
2. Add this entry to `~/.claude/settings.json`, and keep the entries that are already there. The entry is also in `settings_template.json` at the root of this repo:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion$|PromptForUserInput$",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/hooks/ask-context/ask-context-gate.cjs\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

The matcher contains `$`, so Claude Code reads it as a regular expression. It matches `AskUserQuestion`, `PromptForUserInput` and their `mcp__<server>__` forms. The timeout is in seconds.

## Settings

| Variable | Effect |
|----------|--------|
| `ASK_CONTEXT_MIN_CHARS` | Changes the 200-character limit of G3. |
| `ASK_CONTEXT_OFF=1` | Turns the hook off. Use it to debug the hook, not to skip the context. |

## Test

```bash
node --test hooks/ask-context/ask-context-gate.test.cjs
```

The tests need only Node. They ran on Node 22.

## Limits

- G3 counts only the agent's text since the last tool result. The upstream gate counts the whole turn, and that let short questions pass when the text just before them was lost. On one real session of 9 questions, the whole-turn count blocked none. This count blocked 2, and for one of them the transcript holds the text before the question only as a thinking summary. Nine questions is a small sample.
- 200 characters is a size check. It cannot judge quality, and text next to the question may still be unrelated to it.
- An agent can pad a question to reach the limit. Every block message tells the agent to write only facts the user needs to decide and not to pad. The message cannot prevent padding.
- The hook finds the question being asked in the transcript. When the transcript does not contain it yet, an earlier identical question that has an answer is not mistaken for it.
- The hook covers questions and forms only. User-facing text lost between tool calls, outside a question, is not covered.
- The hook cannot see a long report that was lost when the question after it carries 200 or more characters. G3 passes that call, and nothing else signals the loss.
- G2 has no override inside a session. A repeat that you ask for yourself is blocked as well. `ASK_CONTEXT_OFF=1` turns the hook off, and it needs a restart of the app.
- Claude Code adds `PreToolUse:<tool> hook error:` to a block, and the CLI shows the block as a red error. No setting hides it.
- A form answer in an edit-text field is not treated as free text. Only an Other answer of a single-select field is.

## Credit

This is a Node port of `ask-context-gate.py` from [lucasmccomb/ccgm](https://github.com/lucasmccomb/ccgm/tree/main/modules/ask-context), MIT License. It differs in three ways: it runs on Node instead of Python, it supports MCP-named question tools, the JSON answer format and the form tool of Nimbalyst, and G3 counts text since the last tool result instead of the whole turn. The license text is in the header of `ask-context-gate.cjs`.
