# Formatting

Use visual elements whenever they improve clarity — never force one where plain text is cleaner and faster to read.

## Pick the format that fits the content

| Content type | Preferred format |
|---|---|
| Comparisons / pros & cons | Table |
| Step-by-step processes / workflows | Numbered list or Mermaid flowchart |
| Relationships between concepts | Mermaid graph or diagram |
| Sequential phases / pipelines | Mermaid flowchart or sequence diagram |
| Key terms / definitions | Table, or bold term + definition |
| File/folder structures | Code block (tree format) |
| Code examples | Code block with language tag |
| Quick reference / cheat sheets | Table |
| Timelines or progressions | Mermaid timeline or table |

## Icons as visual anchors

Use icons/emojis for recurring concepts where they fit: ⚠️ warnings · ✅ best practices · ❌ anti-patterns · 💡 tips · 🔁 loops/cycles · 🧠 mental models.

Icons cost almost no space — use them freely as scanning anchors where they help.

## Mermaid guidelines

- `flowchart LR` / `flowchart TD` for workflows and processes.
- `sequenceDiagram` for agent interactions or multi-step back-and-forth.
- `graph TD` for concept relationships and dependency trees.
- `classDiagram` for class/type hierarchies and object relationships.
- `erDiagram` for entity relationships and data models.
- `stateDiagram` for state machines and lifecycle flows.
- Keep each diagram focused — one concept per diagram, not everything at once.
- Use `<br>` for line breaks, never `\n`.
- Put every node label in double quotes — always, no exceptions. Never judge case-by-case
  whether a given label needs it.
- Replace `;` with `&#59;` in labels — a literal semicolon breaks Mermaid parsing.

Reach for a diagram when it earns its place — e.g. a failure cascade, a dependency tree, a race condition sequence.

⚠️ **Don't overuse diagrams.** If a relationship fits in ~8 words of prose, write the prose. A two-node `A → B` graph is noise.

## Markdown style

### Headings

- Always use proper Markdown header syntax (`#` through `######`) — never fake a heading with bold text, all-caps text, or plain text on its own line.
- ATX style only (`#` not underlines).
- Increment by one level at a time — never skip.
- Sentence case ("Authentication flow" not "Authentication Flow").
- Keep under 60 characters; no trailing punctuation.
- Blank line before and after every heading.

### Lists

- Unordered: always `-`, never `*` or `+`.
- Nested lists: 2-space indent.
- Blank line before and after every list.
- Parallel structure — all items the same grammatical form.
- Ordered lists for sequences; unordered for sets.

### Code

- Fenced code blocks: always specify the language tag.
- Inline code for commands, variables, file names, and technical terms.

### Links

- Descriptive link text — never "click here" or bare URLs.
- Relative paths for internal links between repo files; chat-response file references follow the harness's own convention (e.g. absolute paths for Nimbalyst file-reference links).

### Tables

- Headers on every column.
- Aligned separators for readability in source.
- Comma-separated lists inside a cell: space after each comma (e.g. `1, 3, 4`) so the cell wraps.

### Other

- No trailing spaces.
- No multiple consecutive blank lines — one at a time.
- Single H1 per document.

## Defaults

- Default to plain prose + bullet points for simple factual answers.
- Each content type in its proper format — don't blur them.
