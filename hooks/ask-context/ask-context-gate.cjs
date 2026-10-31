#!/usr/bin/env node
/*
 * PreToolUse hook for the AskUserQuestion tool, the PromptForUserInput tool, and MCP tools with
 * those names.
 * Input: the hook payload as JSON on stdin.
 * Output: a JSON permissionDecision "deny" on stdout with exit code 0 blocks the call, and its
 * reason is the message. Printing nothing allows it, and so does any error. Exit code 2 without
 * output is the fallback block when stdout cannot be written.
 * Environment: ASK_CONTEXT_MIN_CHARS sets the character limit of G1 and G3 (default 200).
 * ASK_CONTEXT_OFF=1 turns the hook off.
 *
 * Derived from ask-context-gate.py in https://github.com/lucasmccomb/ccgm
 * (modules/ask-context). The MIT License of that work follows.
 *
 * MIT License
 *
 * Copyright (c) 2026 Lucas McComb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
'use strict';

const fs = require('fs');

const DEFAULT_MIN_VISIBLE_CHARS = 200;
const TOOL_NAME_RE = /^(?:mcp__.+__)?(?:AskUserQuestion|PromptForUserInput)$/;
const ANSWERED_MARKER = 'Your questions have been answered';
const REJECTED_RE = /doesn't want to (?:proceed|take this action)/;

const DEICTIC_RE = new RegExp(
  [
    String.raw`\bwith\s+(?:all\s+)?(?:that|this)\s+(?:context|analysis)\b`,
    String.raw`\bwith\s+the\s+(?:above|prior|earlier)\s+(?:context|analysis)\b`,
    String.raw`\bgiven\s+(?:the\s+)?above\b`,
    String.raw`\bgiven\s+(?:that|this)\s+(?:context|analysis)\b`,
    String.raw`\b(?:as|per)\s+(?:described|shown|mentioned|discussed|noted|outlined|summarized|explained|detailed)\s+(?:above|earlier|previously)\b`,
    String.raw`\bsee\s+above\b`,
    String.raw`\bper\s+the\s+above\b`,
    String.raw`\bbased\s+on\s+(?:the|my)\s+(?:above|(?:analysis|context|findings|summary)\s+above)\b`,
    String.raw`\bthe\s+(?:context|analysis|details?|findings|summary|evidence)\s+(?:above|below)\b`,
    String.raw`\b(?:context|analysis|details?|findings|summary|evidence)\s+i\s+(?:just\s+)?(?:provided|gave|shared|showed|outlined)\b`,
    String.raw`\bin\s+light\s+of\s+the\s+above\b`,
  ].join('|'),
  'i',
);

const INJECTED_SPAN_RE =
  /<(system-reminder|local-command-caveat|local-command-stdout|local-command-stderr)\b[^>]*>[\s\S]*?<\/\1\s*>|\[Image: source: [^\]]*\]/gi;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';

function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (isObj(value)) {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + stableStringify(value[k]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}

function hardBlock(message) {
  const decision = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: message,
    },
  };
  try {
    fs.writeSync(1, JSON.stringify(decision));
  } catch (_) {
    process.exit(2);
  }
  process.exit(0);
}

const objectsIn = (value) => (Array.isArray(value) ? value.filter(isObj) : []);
const questionsOf = (toolInput) => objectsIn(toolInput.questions);
const fieldsOf = (toolInput) => objectsIn(toolInput.fields);
const optionsOf = (question) => objectsIn(question.options);

// The two payload shapes are `questions` (AskUserQuestion) and `fields` with `title` and `intro`
// (PromptForUserInput). A unit is one question, or the whole form. `lead` is the text that must
// stand alone, `main` is all text that asks, `details` are option descriptions and item
// subtitles, `previews` are option previews, `labels` are option labels and item titles, and
// `drafts` are edit-text starting texts.
function textUnits(toolInput) {
  const units = questionsOf(toolInput).map((q) => ({
    where: 'question',
    lead: isStr(q.question) ? q.question.trim() : '',
    main: [q.question].filter(isStr),
    details: optionsOf(q).map((o) => o.description).filter(isStr),
    previews: optionsOf(q).map((o) => o.preview).filter(isStr),
    labels: optionsOf(q).map((o) => o.label).filter(isStr),
    drafts: [],
  }));
  const fields = fieldsOf(toolInput);
  if (fields.length > 0) {
    units.push({
      where: 'form text',
      lead: isStr(toolInput.intro) ? toolInput.intro.trim() : '',
      main: [toolInput.title, toolInput.intro, ...fields.flatMap((f) => [f.label, f.description])].filter(isStr),
      details: fields
        .flatMap((f) => [...optionsOf(f).map((o) => o.description), ...objectsIn(f.items).map((i) => i.subtitle)])
        .filter(isStr),
      previews: [],
      labels: fields
        .flatMap((f) => [...optionsOf(f).map((o) => o.label), ...objectsIn(f.items).map((i) => i.title)])
        .filter(isStr),
      drafts: fields.map((f) => f.initialText).filter(isStr),
    });
  }
  return units;
}

const isForm = (toolInput) => questionsOf(toolInput).length === 0 && fieldsOf(toolInput).length > 0;

function questionStrings(toolInput, minVisible) {
  const out = [];
  for (const unit of textUnits(toolInput)) {
    for (const t of unit.main) out.push([unit.where, t]);
    if (unit.lead.length >= minVisible) continue;
    for (const t of unit.details) out.push(['option description', t]);
  }
  return out;
}

const normalizedText = (t) => t.replace(/\s+/g, ' ').trim().toLowerCase();

// Question text with the sorted option labels. Empty when no unit has question text.
function normalizedQuestionKey(toolInput) {
  const keys = textUnits(toolInput)
    .filter((unit) => unit.main.some((t) => t.trim() !== ''))
    .map((unit) => {
      const text = unit.main.map(normalizedText).join('\u0001');
      return text + '\u0002' + unit.labels.map(normalizedText).sort().join('\u0003');
    });
  if (keys.length === 0) return '';
  return (isForm(toolInput) ? 'form:' : '') + keys.sort().join('\u0000');
}

function payloadContextChars(toolInput) {
  return textUnits(toolInput)
    .flatMap((unit) => [...unit.main, ...unit.details, ...unit.previews, ...unit.labels, ...unit.drafts])
    .reduce((total, t) => total + t.trim().length, 0);
}

// Main-chain user and assistant entries, or null when the transcript cannot be read.
function loadMainChain(transcriptPath) {
  if (!isStr(transcriptPath) || transcriptPath === '') return null;
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, 'utf8');
  } catch (_) {
    return null;
  }
  const entries = [];
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    const head = /^\{"type":"([a-z-]+)"/.exec(line);
    if (head && head[1] !== 'user' && head[1] !== 'assistant') continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (_) {
      continue;
    }
    if (!isObj(entry) || entry.isSidechain === true) continue;
    if (entry.type !== 'user' && entry.type !== 'assistant') continue;
    entries.push(entry);
  }
  return entries;
}

function contentBlocks(entry) {
  const content = (entry.message || {}).content;
  return Array.isArray(content) ? content.filter(isObj) : [];
}

const humanAuthoredText = (text) => text.replace(INJECTED_SPAN_RE, '').trim() !== '';

// True for a message the user typed. False for tool results and for entries the harness appends.
// A typed message that carries a reminder block stays real.
function isRealUserMessage(entry) {
  if (entry.type !== 'user' || entry.isMeta === true) return false;
  const content = (entry.message || {}).content;
  if (isStr(content)) return humanAuthoredText(content);
  if (Array.isArray(content)) {
    for (const block of content) {
      if (!isObj(block)) continue;
      if (block.type === 'image') return true;
      if (block.type === 'text' && humanAuthoredText(isStr(block.text) ? block.text : '')) {
        return true;
      }
    }
  }
  return false;
}

function collectAsks(entries) {
  const asks = [];
  entries.forEach((entry, index) => {
    if (entry.type !== 'assistant') return;
    for (const block of contentBlocks(entry)) {
      if (block.type === 'tool_use' && TOOL_NAME_RE.test(block.name || '') && isObj(block.input)) {
        asks.push({ index, id: block.id, input: block.input });
      }
    }
  });
  return asks;
}

// Ids of the tool calls that have a tool result.
function answeredToolIds(entries) {
  const ids = new Set();
  for (const entry of entries) {
    if (entry.type !== 'user') continue;
    for (const block of contentBlocks(entry)) {
      if (block.type === 'tool_result' && isStr(block.tool_use_id)) ids.add(block.tool_use_id);
    }
  }
  return ids;
}

// Asks without the in-flight call: the ask with the hook's tool_use_id, or else the last ask when
// it has the same input and no result yet.
function dropCurrentCall(asks, toolInput, answeredIds, toolUseId) {
  if (isStr(toolUseId) && asks.some((a) => a.id === toolUseId)) {
    return asks.filter((a) => a.id !== toolUseId);
  }
  const last = asks[asks.length - 1];
  if (last && !answeredIds.has(last.id) && stableStringify(last.input) === stableStringify(toolInput)) {
    return asks.slice(0, -1);
  }
  return asks;
}

function resultText(content) {
  if (isStr(content)) return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => isObj(c) && c.type === 'text')
      .map((c) => (isStr(c.text) ? c.text : ''))
      .join('\n');
  }
  return '';
}

// The tool_result for a tool_use id, or null when it was never answered.
function findResult(entries, startIndex, toolUseId) {
  if (!toolUseId) return null;
  for (let i = startIndex + 1; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.type !== 'user') continue;
    for (const block of contentBlocks(entry)) {
      if (block.type !== 'tool_result' || block.tool_use_id !== toolUseId) continue;
      const structured =
        isObj(entry.toolUseResult) && isObj(entry.toolUseResult.answers)
          ? entry.toolUseResult.answers
          : null;
      return { text: resultText(block.content), structured };
    }
  }
  return null;
}

function parseJsonObject(text) {
  try {
    const parsed = JSON.parse(text);
    return isObj(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

// answers: {"<question>": "<answer>"}
function answersMatchOptions(answers, prevInput) {
  for (const q of questionsOf(prevInput)) {
    const labels = optionsOf(q).map((o) => o.label).filter(isStr);
    if (labels.length === 0 || !isStr(q.question) || !(q.question in answers)) continue;
    const given = answers[q.question];
    let list;
    if (Array.isArray(given)) list = given.filter(isStr);
    else if (isStr(given)) list = [given];
    else continue;
    const allLabels = (items) => items.length > 0 && items.every((x) => labels.includes(x));
    const multi = list.length === 1 ? list[0].split(/\s*,\s*/) : [];
    if (!allLabels(list) && !allLabels(multi)) return false;
  }
  return true;
}

// Text form: Your questions have been answered: "<question>"="<answer>", ...
function textAnswersMatchOptions(text, prevInput) {
  if (!text.includes(ANSWERED_MARKER) || !text.includes('="')) return true;
  for (const q of questionsOf(prevInput)) {
    const labels = optionsOf(q).map((o) => o.label).filter(isStr);
    if (labels.length === 0) continue;
    if (!labels.some((label) => text.includes('="' + label + '"'))) return false;
  }
  return true;
}

// answers: {"<field id>": {"type": ..., "selectedId": ..., "otherText": ...}}
const formAnswersMatchOptions = (answers) =>
  !Object.values(answers).some((a) => isObj(a) && isStr(a.otherText));

// 'offered' | 'free' | 'dismissed'
function classifyResult(result, prevInput) {
  const parsed = parseJsonObject(result.text);
  if (REJECTED_RE.test(result.text) || (parsed && parsed.cancelled === true)) {
    return 'dismissed';
  }
  const answers = result.structured || (parsed && isObj(parsed.answers) ? parsed.answers : null);
  if (isForm(prevInput)) return answers && !formAnswersMatchOptions(answers) ? 'free' : 'offered';
  const matched = answers
    ? answersMatchOptions(answers, prevInput)
    : textAnswersMatchOptions(result.text, prevInput);
  return matched ? 'offered' : 'free';
}

// Entries after the user's last real message (all entries if there is none).
function currentTurn(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isRealUserMessage(entries[i])) return entries.slice(i + 1);
  }
  return entries;
}

const hasToolResult = (entry) =>
  entry.type === 'user' && contentBlocks(entry).some((b) => b.type === 'tool_result');

// Characters of assistant `text` blocks since the last tool result, and the number of tool calls
// that already have a result. A question the user answered with an offered option does not count
// as work. Blocks of type `thinking` never count.
function turnVisibility(turnEntries, answeredIds, isOfferedAnswer) {
  let visibleChars = 0;
  let priorTools = 0;
  for (const entry of turnEntries) {
    if (hasToolResult(entry)) visibleChars = 0;
    if (entry.type !== 'assistant') continue;
    for (const block of contentBlocks(entry)) {
      if (block.type === 'text') visibleChars += (isStr(block.text) ? block.text : '').trim().length;
      else if (block.type === 'tool_use' && answeredIds.has(block.id) && !isOfferedAnswer(block)) priorTools++;
    }
  }
  return { visibleChars, priorTools };
}

const NO_PADDING =
  'Do not pad: write only facts the user needs to decide. Filler and repeated text defeat the purpose of this check.';

function gateDeictic(toolInput, toolName, minVisible) {
  for (const [where, text] of questionStrings(toolInput, minVisible)) {
    const match = DEICTIC_RE.exec(text);
    if (!match) continue;
    hardBlock(
      `ASK-CONTEXT GATE [G1]: this ${where} references context the user cannot see ` +
        `(matched: "${match[0]}").\n\n` +
        "The user's screen shows this question payload verbatim. Text you wrote between " +
        'tool calls may reach them only as a one-line progress update, your thinking ' +
        'never does, and raw tool output is collapsed. "I analyzed it" is not "they saw it".\n\n' +
        `Fix: call ${toolName} again with the context IN THE PAYLOAD. The question text ` +
        'stands alone: it names the thing (repo, PR number, symptom), says why it surfaced ' +
        'now, and restates the key evidence as 2-6 short facts, with no "above" and no ' +
        '"that context". Each option description states what that choice implies. ' +
        NO_PADDING,
    );
  }
}

function gateRepeat(entries, toolInput, toolName, answeredIds, toolUseId) {
  const wanted = normalizedQuestionKey(toolInput);
  if (wanted === '') return;
  const asks = dropCurrentCall(collectAsks(entries), toolInput, answeredIds, toolUseId);
  for (let i = asks.length - 1; i >= 0; i--) {
    const ask = asks[i];
    if (normalizedQuestionKey(ask.input) !== wanted) continue;
    const result = findResult(entries, ask.index, ask.id);
    let reason;
    if (result === null) {
      reason = 'the question was interrupted before they answered';
    } else {
      const kind = classifyResult(result, ask.input);
      if (kind === 'dismissed') reason = 'they dismissed it';
      else if (kind === 'free') {
        reason =
          'they answered in their own words instead of picking an option, which is ' +
          'usually a request for more context';
      } else {
        return;
      }
    }
    hardBlock(
      `ASK-CONTEXT GATE [G2]: you already asked this question with the same options and ${reason}. ` +
        'Asking it again unchanged ignores their reply.\n\n' +
        `Fix: call ${toolName} again with a REWRITTEN payload that embeds the context ` +
        '(what is being decided, the key evidence as 2-6 short facts, and what each ' +
        'option implies) and that answers what the user actually said. Never re-send an ' +
        'unchanged payload after the user pushed back on it. ' +
        NO_PADDING,
    );
  }
}

function gateInvisibleContext(entries, toolInput, minVisible, toolName, answeredIds) {
  const isOfferedAnswer = (block) => {
    if (!TOOL_NAME_RE.test(block.name || '') || !isObj(block.input)) return false;
    const result = findResult(entries, -1, block.id);
    return result !== null && classifyResult(result, block.input) === 'offered';
  };
  const { visibleChars, priorTools } = turnVisibility(currentTurn(entries), answeredIds, isOfferedAnswer);
  if (priorTools < 1) return;
  const payloadChars = payloadContextChars(toolInput);
  if (visibleChars >= minVisible || payloadChars >= minVisible) return;
  hardBlock(
    `ASK-CONTEXT GATE [G3]: you are mid-workstream (${priorTools} tool call(s) since the ` +
      `user's last message). This question payload carries only ${payloadChars} characters ` +
      `of context (question text, option labels, descriptions, previews and starting texts), and only ${visibleChars} ` +
      'characters of your text since your last tool result reached the transcript. Whatever ' +
      'analysis exists is in your thinking and in collapsed tool output, so the user cannot see it.\n\n' +
      'Text written between tool calls is not a reliable surface: the API may deliver it as a ' +
      'one-line progress update and the transcript records it as thinking. Writing a brief and ' +
      `calling again will not pass this gate. Put the context IN THE PAYLOAD, then call ` +
      `${toolName} again:\n` +
      '- the question text names the thing (repo, PR number, file, symptom) and says why the ' +
      'decision surfaced now;\n' +
      "- each option's description states what choosing it implies;\n" +
      '- the key evidence, restated as 2-6 short facts, goes in the question text.\n' +
      `At least ${minVisible} characters across those fields passes ` +
      '(ASK_CONTEXT_MIN_CHARS changes the limit). ' +
      NO_PADDING,
  );
}

function run(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (_) {
    return;
  }
  if (!isObj(data) || !TOOL_NAME_RE.test(String(data.tool_name || ''))) return;
  if (process.env.ASK_CONTEXT_OFF === '1') return;
  const toolInput = data.tool_input;
  if (!isObj(toolInput) || textUnits(toolInput).length === 0) return;
  const toolName = data.tool_name;
  let minVisible = parseInt(process.env.ASK_CONTEXT_MIN_CHARS, 10);
  if (!Number.isFinite(minVisible)) minVisible = DEFAULT_MIN_VISIBLE_CHARS;

  gateDeictic(toolInput, toolName, minVisible);

  const entries = loadMainChain(data.transcript_path);
  if (entries === null) return;

  const answeredIds = answeredToolIds(entries);
  gateRepeat(entries, toolInput, toolName, answeredIds, data.tool_use_id);
  gateInvisibleContext(entries, toolInput, minVisible, toolName, answeredIds);
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try {
    run(Buffer.concat(chunks).toString('utf8'));
  } catch (_) {
    // Any error allows the call.
  }
  process.exit(0);
});
