'use strict';

// Run with: node --test hooks/ask-context/ask-context-gate.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOK = path.join(__dirname, 'ask-context-gate.cjs');
const BUILTIN = 'AskUserQuestion';
const MCP = 'mcp__nimbalyst__AskUserQuestion';
const LONG = 'x'.repeat(220);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ask-context-test-'));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

let counter = 0;
const nextId = () => `toolu_${++counter}`;

const userMsg = (text, extra = {}) => ({
  type: 'user',
  message: { role: 'user', content: [{ type: 'text', text }] },
  ...extra,
});
const assistant = (...content) => ({ type: 'assistant', message: { role: 'assistant', content } });
const text = (t) => ({ type: 'text', text: t });
const thinking = (t) => ({ type: 'thinking', thinking: t });
const toolUse = (name, input, id) => ({ type: 'tool_use', id, name, input });
const toolResult = (id, content, extra = {}) => ({
  type: 'user',
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content }] },
  ...extra,
});

const payload = (question, labels = ['Yes', 'No'], description = '') => ({
  questions: [
    {
      question,
      header: 'Q',
      multiSelect: false,
      options: labels.map((label) => ({ label, description })),
    },
  ],
});

function run({ tool = BUILTIN, input, entries, transcriptPath, env = {} }) {
  let tp = transcriptPath;
  if (entries) {
    tp = path.join(tmp, `t-${++counter}.jsonl`);
    fs.writeFileSync(tp, entries.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n') + '\n');
  }
  const stdin = JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: tool,
    tool_input: input,
    transcript_path: tp,
  });
  const r = spawnSync(process.execPath, [HOOK], {
    input: stdin,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  let decision = null;
  try {
    decision = JSON.parse(r.stdout).hookSpecificOutput;
  } catch (_) {
    // An allowed call prints nothing.
  }
  const blocked = decision !== null && decision.permissionDecision === 'deny';
  return {
    code: r.status,
    stderr: r.stderr,
    stdout: r.stdout,
    decision,
    blocked,
    reason: blocked ? decision.permissionDecisionReason : '',
  };
}

function midWork(input, { extra = [], tool = BUILTIN } = {}) {
  const a = nextId();
  const q = nextId();
  return [
    userMsg('please check the repo'),
    assistant(toolUse('Read', { file_path: 'a.txt' }, a)),
    toolResult(a, 'ok'),
    ...extra,
    assistant(toolUse(tool, input, q)),
  ];
}

test('G1 blocks a deictic reference in the question text', () => {
  const r = run({ input: payload('With that context, which option?') });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G1\]/);
  assert.match(r.reason, /with that context/i);
});

test('G1 blocks a deictic reference in an option description', () => {
  const r = run({ input: payload('Which option?', ['A', 'B'], 'See above for the reasons.') });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /option description/);
});

test('a block is a JSON deny decision on stdout with exit code 0 and an empty stderr', () => {
  const r = run({ input: payload('With that context, which option?') });
  assert.equal(r.code, 0);
  assert.equal(r.stderr, '');
  assert.equal(r.decision.hookEventName, 'PreToolUse');
  assert.equal(r.decision.permissionDecision, 'deny');
  assert.match(r.decision.permissionDecisionReason, /^ASK-CONTEXT GATE \[G1\]/);
});

test('an allowed call prints nothing', () => {
  const r = run({ input: payload('Delete the branch fix-login?') });
  assert.equal(r.code, 0);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('G1 allows a payload that stands alone', () => {
  assert.equal(run({ input: payload('Delete the branch fix-login?') }).blocked, false);
});

test('G1 skips option descriptions when the question has 200+ characters of its own', () => {
  const input = payload(`Commit the two changes as separate commits? ${LONG}`, ['Two commits', 'One commit'], 'Commit them separately, as described above.');
  assert.equal(run({ input }).blocked, false);
});

test('G1 still checks the text of a long question', () => {
  const input = payload(`${LONG} See above for the details.`, ['A', 'B']);
  const r = run({ input });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /this question/);
});

test('G1 applies to an MCP tool named AskUserQuestion', () => {
  const r = run({ tool: MCP, input: payload('Given the above, which one?') });
  assert.equal(r.blocked, true);
  assert.match(r.reason, new RegExp(MCP));
});

test('ignores tools that are not a question tool', () => {
  assert.equal(run({ tool: 'Bash', input: { command: 'echo with that context' } }).blocked, false);
});

test('ignores an MCP tool that takes a different payload shape', () => {
  const tool = 'mcp__x__AskUserQuestion';
  const input = { title: 'with that context' };
  assert.equal(run({ tool, input, entries: midWork(input, { tool }) }).blocked, false);
});

test('G3 allows a first-action question after the user message', () => {
  const input = payload('Which one?');
  const entries = [userMsg('ask me something'), assistant(toolUse(BUILTIN, input, nextId()))];
  assert.equal(run({ input, entries }).blocked, false);
});

test('G3 blocks a short mid-workstream question', () => {
  const input = payload('Which one?');
  const r = run({ input, entries: midWork(input) });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G3\]/);
  assert.match(r.reason, /Do not pad/);
});

test('G3 counts an earlier answered identical ask when the in-flight call is not yet in the transcript', () => {
  const input = payload('Which one?');
  const a = nextId();
  const entries = [
    userMsg('ask me'),
    assistant(toolUse(BUILTIN, input, a)),
    toolResult(a, 'Your questions have been answered: "Which one?"="Yes".'),
  ];
  assert.equal(run({ input, entries }).blocked, true);
});

test('G3 allows a short question when 200+ characters of turn text were stored', () => {
  const input = payload('Which one?');
  const r = run({ input, entries: midWork(input, { extra: [assistant(text(LONG))] }) });
  assert.equal(r.blocked, false);
});

test('G3 does not count text from before an earlier tool result', () => {
  const input = payload('Which one?');
  const a = nextId();
  const b = nextId();
  const q = nextId();
  const entries = [
    userMsg('please check the repo'),
    assistant(text(LONG), toolUse('Read', {}, a)),
    toolResult(a, 'ok'),
    assistant(toolUse('Read', {}, b)),
    toolResult(b, 'ok'),
    assistant(toolUse(BUILTIN, input, q)),
  ];
  assert.equal(run({ input, entries }).blocked, true);
});

test('G3 counts text that sits between the last tool result and the question', () => {
  const input = payload('Which one?');
  const a = nextId();
  const entries = [
    userMsg('please check the repo'),
    assistant(toolUse('Read', {}, a)),
    toolResult(a, 'ok'),
    assistant(text(LONG)),
    assistant(toolUse(BUILTIN, input, nextId())),
  ];
  assert.equal(run({ input, entries }).blocked, false);
});

test('G3 allows a mid-workstream question whose payload carries 200+ characters', () => {
  const input = payload(LONG);
  assert.equal(run({ input, entries: midWork(input) }).blocked, false);
});

test('G3 counts option descriptions as payload context', () => {
  const input = payload('Which one?', ['A', 'B'], 'y'.repeat(110));
  assert.equal(run({ input, entries: midWork(input) }).blocked, false);
});

test('G3 does not count thinking blocks', () => {
  const input = payload('Which one?');
  const r = run({ input, entries: midWork(input, { extra: [assistant(thinking(LONG))] }) });
  assert.equal(r.blocked, true);
});

test('G3 ignores text from subagent (sidechain) entries', () => {
  const input = payload('Which one?');
  const side = { ...assistant(text(LONG)), isSidechain: true };
  assert.equal(run({ input, entries: midWork(input, { extra: [side] }) }).blocked, true);
});

test('G3 does not count the in-flight call as a prior tool call', () => {
  const input = payload('Which one?');
  const entries = [userMsg('hi'), assistant(toolUse(BUILTIN, input, nextId()))];
  assert.equal(run({ input, entries }).blocked, false);
});

test('G3 does not count a tool call that has no result yet (parallel call)', () => {
  const input = payload('Which one?');
  const entries = [
    userMsg('run it and ask me'),
    assistant(toolUse('Bash', { command: 'git rev-parse --short HEAD' }, nextId())),
    assistant(toolUse(BUILTIN, input, nextId())),
  ];
  assert.equal(run({ input, entries }).blocked, false);
});

test('G3 counts a tool call once its result is in the transcript', () => {
  const input = payload('Which one?');
  const a = nextId();
  const entries = [
    userMsg('run it and ask me'),
    assistant(toolUse('Bash', { command: 'git rev-parse --short HEAD' }, a)),
    toolResult(a, '5b0b5b2'),
    assistant(toolUse(BUILTIN, input, nextId())),
  ];
  assert.equal(run({ input, entries }).blocked, true);
});

test('G3 works for an MCP-named question tool', () => {
  const input = payload('Which one?');
  const r = run({ tool: MCP, input, entries: midWork(input, { tool: MCP }) });
  assert.equal(r.blocked, true);
});

test('G3 keeps counting tool calls across harness-injected user entries', () => {
  const input = payload('Which one?');
  const reminder = userMsg('<system-reminder>\nnew rules\n</system-reminder>');
  const meta = userMsg('Base directory for this skill', { isMeta: true });
  assert.equal(run({ input, entries: midWork(input, { extra: [reminder, meta] }) }).blocked, true);
});

test('G3 starts a new turn at a real user message that carries a reminder', () => {
  const input = payload('Which one?');
  const a = nextId();
  const entries = [
    userMsg('first request'),
    assistant(toolUse('Read', {}, a)),
    toolResult(a, 'ok'),
    userMsg('<system-reminder>\nrules\n</system-reminder>\nsecond request'),
    assistant(toolUse(BUILTIN, input, nextId())),
  ];
  assert.equal(run({ input, entries }).blocked, false);
});

test('ASK_CONTEXT_MIN_CHARS changes the limits', () => {
  const input = payload('A question of about sixty characters, no more than that?');
  const entries = midWork(input);
  assert.equal(run({ input, entries }).blocked, true);
  assert.equal(run({ input, entries, env: { ASK_CONTEXT_MIN_CHARS: '40' } }).blocked, false);
});

function repeated(resultContent, { resultExtra = {}, answered = true, tool = BUILTIN, between = [] } = {}) {
  const input = payload(`Which option should the deploy use? ${LONG}`, ['Option A', 'Option B']);
  const a = nextId();
  const b = nextId();
  const base = [userMsg('deploy it'), assistant(toolUse(tool, input, a))];
  if (answered) base.push(toolResult(a, resultContent, resultExtra));
  base.push(userMsg('hm'), ...between, assistant(toolUse(tool, input, b)));
  return { input, entries: base };
}
const question = (input) => input.questions[0].question;
const builtinResult = (input, answer) =>
  `Your questions have been answered: "${question(input)}"="${answer}". You can now continue with these answers in mind.`;
const mcpResult = (input, answer) => [
  { type: 'text', text: JSON.stringify({ answers: { [question(input)]: answer }, respondedBy: 'desktop' }) },
];

test('G2 blocks a repeat after a free-text answer (built-in result text)', () => {
  const probe = repeated('');
  const { input, entries } = repeated(builtinResult(probe.input, 'what context?'));
  const r = run({ input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G2\]/);
});

test('G2 allows a repeat after the user picked an offered option', () => {
  const probe = repeated('');
  const { input, entries } = repeated(builtinResult(probe.input, 'Option A'));
  assert.equal(run({ input, entries }).blocked, false);
});

test('G2 blocks a repeat after the prompt was dismissed', () => {
  const { input, entries } = repeated("The user doesn't want to proceed with this tool use.");
  const r = run({ input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /dismissed/);
});

test('G2 blocks a repeat of a question that was never answered', () => {
  const { input, entries } = repeated('', { answered: false });
  const r = run({ input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /interrupted/);
});

test('G2 blocks a repeat when the in-flight call is not yet in the transcript', () => {
  const input = payload(`Which option should the deploy use? ${LONG}`, ['Option A', 'Option B']);
  const a = nextId();
  const entries = [
    userMsg('deploy it'),
    assistant(toolUse(BUILTIN, input, a)),
    toolResult(a, builtinResult(input, 'what context?')),
    userMsg('hm'),
  ];
  assert.equal(run({ input, entries }).blocked, true);
});

test('G2 blocks a repeat after a free-text answer even when the agent made tool calls since', () => {
  const probe = repeated('');
  const x = nextId();
  const { input, entries } = repeated(builtinResult(probe.input, 'give them by severity'), {
    between: [assistant(toolUse('Read', {}, x)), toolResult(x, 'ok')],
  });
  assert.equal(run({ input, entries }).blocked, true);
});

test('G2 blocks a repeat of an unanswered ask even when the agent made tool calls since', () => {
  const x = nextId();
  const { input, entries } = repeated('', {
    answered: false,
    between: [assistant(toolUse('Read', {}, x)), toolResult(x, 'ok')],
  });
  assert.equal(run({ input, entries }).blocked, true);
});

test('G2 still blocks a repeat when only text separates the two asks', () => {
  const probe = repeated('');
  const { input, entries } = repeated(builtinResult(probe.input, 'what context?'), {
    between: [assistant(text(LONG))],
  });
  assert.equal(run({ input, entries }).blocked, true);
});

test('G2 allows a different question set', () => {
  const { entries } = repeated(builtinResult(repeated('').input, 'what context?'));
  const input = payload(`A different question about logging. ${LONG}`, ['Option A', 'Option B']);
  assert.equal(run({ input, entries }).blocked, false);
});

test('G2 blocks a repeat after a free-text answer (MCP JSON answers)', () => {
  const probe = repeated('', { tool: MCP });
  const { input, entries } = repeated(mcpResult(probe.input, 'explain more'), { tool: MCP });
  const r = run({ tool: MCP, input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G2\]/);
});

test('G2 allows a repeat after an offered option (MCP JSON answers)', () => {
  const probe = repeated('', { tool: MCP });
  const { input, entries } = repeated(mcpResult(probe.input, 'Option B'), { tool: MCP });
  assert.equal(run({ tool: MCP, input, entries }).blocked, false);
});

test('G2 accepts several offered options joined by commas (multi-select)', () => {
  const probe = repeated('', { tool: MCP });
  const { input, entries } = repeated(mcpResult(probe.input, 'Option A, Option B'), { tool: MCP });
  assert.equal(run({ tool: MCP, input, entries }).blocked, false);
});

test('G2 blocks a repeat after a cancelled MCP prompt', () => {
  const { input, entries } = repeated(JSON.stringify({ cancelled: true, respondedBy: 'desktop' }), { tool: MCP });
  const r = run({ tool: MCP, input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /dismissed/);
});

test('G2 reads structured answers from toolUseResult', () => {
  const probe = repeated('', {});
  const structured = { toolUseResult: { answers: { [question(probe.input)]: 'free words' } } };
  const { input, entries } = repeated('opaque text', { resultExtra: structured });
  assert.equal(run({ input, entries }).blocked, true);
});

test('G2 fails open on an unrecognized result format', () => {
  const { input, entries } = repeated('something unexpected');
  assert.equal(run({ input, entries }).blocked, false);
});

const FORM = 'mcp__nimbalyst__PromptForUserInput';
const formPayload = (intro, { title = 'Decision', description, optionDescription = '', items } = {}) => ({
  title,
  intro,
  fields: [
    {
      type: 'singleSelect',
      id: 'decision',
      label: 'Which option?',
      ...(description === undefined ? {} : { description }),
      options: [
        { id: 'a', label: 'Option A', description: optionDescription },
        { id: 'b', label: 'Option B', description: optionDescription },
      ],
    },
    ...(items === undefined ? [] : [{ type: 'multiSelect', id: 'picks', label: 'Pick some', items }]),
  ],
});

test('forms: G1 blocks a deictic reference in the intro', () => {
  const r = run({ tool: FORM, input: formPayload('Given the above, choose one.') });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G1\]/);
  assert.match(r.reason, new RegExp(FORM));
});

test('forms: G1 blocks a deictic reference in the title, a field label and a field description', () => {
  assert.equal(run({ tool: FORM, input: formPayload('Choose.', { title: 'See above' }) }).blocked, true);
  assert.equal(run({ tool: FORM, input: formPayload('Choose.', { description: 'As described above.' }) }).blocked, true);
  const labelInput = formPayload('Choose.');
  labelInput.fields[0].label = 'Per the above, which?';
  assert.equal(run({ tool: FORM, input: labelInput }).blocked, true);
});

test('forms: G1 blocks a deictic reference in an option description and an item subtitle', () => {
  const r = run({ tool: FORM, input: formPayload('Choose.', { optionDescription: 'See above.' }) });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /option description/);
  const items = [{ id: 'x', title: 'X', subtitle: 'Explained above, see above.' }];
  assert.equal(run({ tool: FORM, input: formPayload('Choose.', { items }) }).blocked, true);
});

test('forms: G1 skips option descriptions when the intro has 200+ characters', () => {
  const input = formPayload(`Choose one. ${LONG}`, { optionDescription: 'See above.' });
  assert.equal(run({ tool: FORM, input }).blocked, false);
});

test('forms: G1 allows a form that stands alone', () => {
  assert.equal(run({ tool: FORM, input: formPayload('Delete the branch fix-login?') }).blocked, false);
});

test('forms: a payload without questions or fields is ignored', () => {
  assert.equal(run({ tool: FORM, input: { title: 'See above', intro: 'with that context' } }).blocked, false);
});

test('forms: G3 allows a first-action form', () => {
  const input = formPayload('Choose.');
  const entries = [userMsg('ask me'), assistant(toolUse(FORM, input, nextId()))];
  assert.equal(run({ tool: FORM, input, entries }).blocked, false);
});

test('forms: G3 blocks a short mid-workstream form', () => {
  const input = formPayload('Choose.');
  const r = run({ tool: FORM, input, entries: midWork(input, { tool: FORM }) });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G3\]/);
});

test('forms: G3 allows a mid-workstream form with 200+ characters of payload', () => {
  const input = formPayload(LONG);
  assert.equal(run({ tool: FORM, input, entries: midWork(input, { tool: FORM }) }).blocked, false);
});

test('forms: G3 counts option descriptions and item subtitles as payload context', () => {
  const byOption = formPayload('Choose.', { optionDescription: 'y'.repeat(110) });
  assert.equal(run({ tool: FORM, input: byOption, entries: midWork(byOption, { tool: FORM }) }).blocked, false);
  const byItems = formPayload('Choose.', { items: [{ id: 'x', title: 'X', subtitle: 'z'.repeat(220) }] });
  assert.equal(run({ tool: FORM, input: byItems, entries: midWork(byItems, { tool: FORM }) }).blocked, false);
});

test('forms: G3 allows a short form when 200+ characters of turn text were stored', () => {
  const input = formPayload('Choose.');
  const r = run({ tool: FORM, input, entries: midWork(input, { tool: FORM, extra: [assistant(text(LONG))] }) });
  assert.equal(r.blocked, false);
});

function repeatedForm(resultContent, { answered = true, between = [] } = {}) {
  const input = formPayload(`Which option should the deploy use? ${LONG}`);
  const a = nextId();
  const b = nextId();
  const base = [userMsg('deploy it'), assistant(toolUse(FORM, input, a))];
  if (answered) base.push(toolResult(a, resultContent));
  base.push(userMsg('hm'), ...between, assistant(toolUse(FORM, input, b)));
  return { input, entries: base };
}
const formAnswers = (answers) => JSON.stringify({ answers, respondedBy: 'desktop' });

test('forms: G2 blocks a repeat after an Other answer', () => {
  const { input, entries } = repeatedForm(
    formAnswers({ decision: { type: 'singleSelect', selectedId: '__other__', otherText: 'explain more' } }),
  );
  const r = run({ tool: FORM, input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /\[G2\]/);
});

test('forms: G2 allows a repeat after an offered option', () => {
  const { input, entries } = repeatedForm(formAnswers({ decision: { type: 'singleSelect', selectedId: 'a' } }));
  assert.equal(run({ tool: FORM, input, entries }).blocked, false);
});

test('forms: G2 allows a repeat after multi-select, confirm and edited-text answers', () => {
  for (const answers of [
    { picks: { type: 'multiSelect', selectedIds: ['x'] } },
    { ok: { type: 'confirm', value: true } },
    { draft: { type: 'editText', text: 'my words', edited: true } },
  ]) {
    const { input, entries } = repeatedForm(formAnswers(answers));
    assert.equal(run({ tool: FORM, input, entries }).blocked, false);
  }
});

test('forms: G2 blocks a repeat after a cancelled form', () => {
  const { input, entries } = repeatedForm(JSON.stringify({ cancelled: true, respondedBy: 'desktop' }));
  const r = run({ tool: FORM, input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /dismissed/);
});

test('forms: G2 blocks a repeat of a form that was never answered', () => {
  const { input, entries } = repeatedForm('', { answered: false });
  const r = run({ tool: FORM, input, entries });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /interrupted/);
});

test('forms: G2 allows a different form', () => {
  const { entries } = repeatedForm(JSON.stringify({ cancelled: true }));
  const input = formPayload(`A different decision about logging. ${LONG}`);
  assert.equal(run({ tool: FORM, input, entries }).blocked, false);
});

test('forms: G2 does not mix a form with a question that has similar words', () => {
  const asked = formPayload(`Which option should the deploy use? ${LONG}`);
  const a = nextId();
  const entries = [
    userMsg('deploy it'),
    assistant(toolUse(FORM, asked, a)),
    toolResult(a, JSON.stringify({ cancelled: true })),
    userMsg('hm'),
  ];
  const input = payload(`Which option should the deploy use? ${LONG}`, ['Option A', 'Option B']);
  assert.equal(run({ input, entries }).blocked, false);
});

test('allows when the transcript path is missing (G1 still runs)', () => {
  assert.equal(run({ input: payload('Which one?') }).blocked, false);
  assert.equal(run({ input: payload('See above, which one?') }).blocked, true);
});

test('allows when the transcript file does not exist', () => {
  assert.equal(run({ input: payload('Which one?'), transcriptPath: path.join(tmp, 'missing.jsonl') }).blocked, false);
});

test('skips malformed transcript lines', () => {
  const input = payload('Which one?');
  const entries = midWork(input);
  entries.splice(1, 0, '{not json', '');
  assert.equal(run({ input, entries }).blocked, true);
});

test('allows on invalid stdin', () => {
  const r = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.equal(r.status, 0);
});

test('ASK_CONTEXT_OFF=1 disables the hook', () => {
  const r = run({ input: payload('See above, which one?'), env: { ASK_CONTEXT_OFF: '1' } });
  assert.equal(r.blocked, false);
});
