const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { summarizeStreak, dayKey, getProgressSummary, reconcileActivity, dateFromDayKey } = require('../services/progressService');
const { generateRevisionSchedule, getProblemStatusAfterRevision, isRevisionDue } = require('../services/revisionService');
const Problem = require('../models/Problem');
const Activity = require('../models/Activity');
const Revision = require('../models/Revision');
const progressService = require('../services/progressService');
const { normalizeAndDeduplicate, buildSolveDateUpdates } = require('../services/leetcodeImportService');
const { problemValidator, problemUpdateValidator } = require('../validators/problemValidator');
const { protect } = require('../middleware/auth');
const { sendTokenResponse } = require('../utils/tokenUtils');

const validate = async (chain, req) => {
  for (const rule of chain) await rule.run(req);
  return validationResult(req).array();
};

test('streak calculation deduplicates dates and counts consecutive local calendar days', () => {
  const now = new Date('2026-11-20T12:00:00.000Z');
  assert.deepEqual(summarizeStreak(['2026-11-18', '2026-11-19', '2026-11-19'], now), {
    currentStreak: 2,
    longestStreak: 2,
    lastActiveDate: new Date('2026-11-19T00:00:00.000Z'),
  });
  assert.equal(summarizeStreak(['2026-11-16'], now).currentStreak, 0);
  assert.equal(dayKey('2026-11-20T20:00:00.000Z'), '2026-11-21');
});

test('revision schedule uses solve day and stable calendar intervals', () => {
  const schedule = generateRevisionSchedule(new Date('2026-11-20T21:00:00.000Z'));
  assert.deepEqual(schedule.slice(0, 3).map((date) => date.toISOString()), [
    '2026-11-22T00:00:00.000Z', '2026-11-24T00:00:00.000Z', '2026-11-28T00:00:00.000Z',
  ]);
  assert.equal(schedule.length, 6);
  assert.equal(getProblemStatusAfterRevision(false), 'Solved');
  assert.equal(getProblemStatusAfterRevision(true), 'Revised');
  assert.equal(isRevisionDue(schedule[0], new Date('2026-11-21T17:00:00Z')), false);
  assert.equal(isRevisionDue(schedule[0], new Date('2026-11-22T00:00:00Z')), true);
});

test('progress summary reads the problem source of truth instead of cached counters', async () => {
  const originalAggregate = Problem.aggregate;
  Problem.aggregate = async (pipeline) => (pipeline[0].$match.status
    ? [{ _id: '2026-11-18' }, { _id: '2026-11-19' }]
    : [{ _id: null, totalProblems: 4, solvedCount: 2, easyCount: 1, mediumCount: 1, hardCount: 0 }]);
  try {
    const summary = await getProgressSummary('user-id', new Date('2026-11-20T12:00:00Z'));
    assert.equal(summary.totalProblems, 4);
    assert.equal(summary.solvedCount, 2);
    assert.equal(summary.currentStreak, 2);
    assert.equal(summary.longestStreak, 2);
  } finally {
    Problem.aggregate = originalAggregate;
  }
});

test('activity reconciliation upserts actual solve dates and zeroes stale rows', async () => {
  const originals = {
    aggregate: Problem.aggregate,
    find: Activity.find,
    findOneAndUpdate: Activity.findOneAndUpdate,
    updateOne: Activity.updateOne,
  };
  const upserts = [];
  const updates = [];
  Problem.aggregate = async () => [{ _id: '2026-11-19', problemsSolved: 2, minutesStudied: 40, problems: ['p1', 'p2'] }];
  Activity.find = () => ({
    select: () => ({ lean: async () => [
      { _id: 'active', date: dateFromDayKey('2026-11-19'), dayKey: undefined },
      { _id: 'stale', date: dateFromDayKey('2026-11-18'), dayKey: undefined },
    ] }),
  });
  Activity.findOneAndUpdate = async (...args) => { upserts.push(args); };
  Activity.updateOne = async (...args) => { updates.push(args); };
  try {
    await reconcileActivity('user-id');
    assert.equal(upserts.length, 1);
    assert.equal(upserts[0][1].$set.problemsSolved, 2);
    assert.equal(upserts[0][1].$set.dayKey, '2026-11-19');
    assert.equal(updates.length, 2); // adopt the legacy active row and zero the stale day
    assert.equal(updates[1][1].$set.problemsSolved, 0);
  } finally {
    Problem.aggregate = originals.aggregate;
    Activity.find = originals.find;
    Activity.findOneAndUpdate = originals.findOneAndUpdate;
    Activity.updateOne = originals.updateOne;
  }
});

test('LeetCode import rejects invalid records and deduplicates current and existing data', () => {
  const record = (slug, problemId) => ({
    slug, problemId, title: 'Valid problem', difficulty: 'Easy', topic: 'Uncategorized', dateSolved: null,
  });
  const result = normalizeAndDeduplicate([
    record('two-sum', '1'), record('two-sum', '1'), record('valid-new', '2'),
    { ...record('bad date', '3'), dateSolved: 'not-a-date' },
  ], [{ slug: 'existing', problemId: '9' }]);
  assert.equal(result.problems.length, 2);
  assert.equal(result.invalid, 1);
  assert.deepEqual(result.problems.map((problem) => problem.slug), ['two-sum', 'valid-new']);
});

test('LeetCode resync refreshes known historical dates for existing solved records', () => {
  const oldDate = new Date('2026-11-20T00:00:00Z');
  const actualDate = new Date('2026-11-10T00:00:00Z');
  const existing = [{ _id: 'existing-id', slug: 'two-sum', problemId: '1', status: 'Solved', dateSolved: oldDate }];
  const normalized = normalizeAndDeduplicate([{
    slug: 'two-sum', problemId: '1', title: 'Two Sum', difficulty: 'Easy',
    topic: 'Uncategorized', dateSolved: actualDate,
  }], existing);
  assert.equal(normalized.problems.length, 0);
  assert.deepEqual(buildSolveDateUpdates(normalized.records, existing), [{ _id: 'existing-id', dateSolved: actualDate }]);
});

test('problem create and update validation accept allowed input and reject unsafe values', async () => {
  const createReq = { body: { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', status: 'Solved' } };
  assert.deepEqual(await validate(problemValidator, createReq), []);

  const badCreate = { body: { title: 'Two Sum', difficulty: 'Trivial', topic: 'Arrays', status: 'Revised' } };
  assert.ok((await validate(problemValidator, badCreate)).length >= 2);

  const goodUpdate = { body: { status: 'Need Revision', notes: 'Try again' } };
  assert.deepEqual(await validate(problemUpdateValidator, goodUpdate), []);
  const unsafeUpdate = { body: { user: 'someone-else', totalProblems: 800 } };
  assert.ok((await validate(problemUpdateValidator, unsafeUpdate)).length > 0);
});

test('problem create, solve transition and delete stay user-scoped and reconcile activity', async () => {
  const originals = {
    create: Problem.create,
    findOne: Problem.findOne,
    findOneAndDelete: Problem.findOneAndDelete,
    revisionFindOne: Revision.findOne,
    revisionUpsert: Revision.findOneAndUpdate,
    revisionDelete: Revision.findOneAndDelete,
    reconcileActivity: progressService.reconcileActivity,
  };
  const calls = { revisionFilter: null, revisionPayload: null, activity: 0 };
  progressService.reconcileActivity = async () => { calls.activity += 1; };
  const controller = require('../controllers/problemController');
  const stored = {
    _id: 'problem-id', user: 'user-id', status: 'Not Started', dateSolved: null,
    nextRevisionDate: null, set(field, value) { this[field] = value; }, async save() {},
  };
  Problem.create = async (input) => { Object.assign(stored, input); return stored; };
  Problem.findOne = async (filter) => { calls.problemFilter = filter; return stored; };
  Problem.findOneAndDelete = async (filter) => { calls.deleteFilter = filter; return stored; };
  Revision.findOne = async () => null;
  Revision.findOneAndUpdate = async (filter, payload) => {
    calls.revisionFilter = filter;
    calls.revisionPayload = payload;
    return { isComplete: false, scheduledDates: generateRevisionSchedule(new Date('2026-11-19T00:00:00Z')), currentStep: 0 };
  };
  Revision.findOneAndDelete = async (filter) => { calls.revisionDeleteFilter = filter; };
  const invoke = async (handler, req) => {
    let body;
    let status;
    const res = { status(code) { status = code; return this; }, json(value) { body = value; return this; } };
    let nextError;
    await handler(req, res, (error) => { nextError = error; });
    if (nextError) throw nextError;
    return { status, body };
  };
  try {
    const created = await invoke(controller.createProblem, {
      body: { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', status: 'Solved', dateSolved: new Date('2026-11-19T00:00:00Z') },
      user: { _id: 'user-id' },
    });
    assert.equal(created.status, 201);
    assert.equal(calls.revisionFilter.user, 'user-id');
    assert.equal(calls.revisionPayload.$set.currentStep, 0);
    assert.equal(calls.activity, 1);

    stored.status = 'Not Started';
    stored.dateSolved = null;
    const updated = await invoke(controller.updateProblem, {
      params: { id: 'problem-id' }, body: { status: 'Solved', dateSolved: new Date('2026-11-19T00:00:00Z') },
      user: { _id: 'user-id' },
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(calls.problemFilter, { _id: 'problem-id', user: 'user-id' });
    assert.equal(calls.activity, 2);

    await invoke(controller.deleteProblem, { params: { id: 'problem-id' }, user: { _id: 'user-id' } });
    assert.deepEqual(calls.deleteFilter, { _id: 'problem-id', user: 'user-id' });
    assert.equal(calls.activity, 3);
  } finally {
    Problem.create = originals.create;
    Problem.findOne = originals.findOne;
    Problem.findOneAndDelete = originals.findOneAndDelete;
    Revision.findOne = originals.revisionFindOne;
    Revision.findOneAndUpdate = originals.revisionUpsert;
    Revision.findOneAndDelete = originals.revisionDelete;
    progressService.reconcileActivity = originals.reconcileActivity;
  }
});

test('problem API enforces page-size and sort allowlists before querying data', async () => {
  const controller = require('../controllers/problemController');
  const invoke = async (query) => {
    let result;
    const res = { status(code) { result = { status: code }; return this; }, json(body) { result.body = body; return this; } };
    await controller.getProblems({ query, user: { _id: 'user-id' } }, res, (error) => { throw error; });
    return result;
  };
  assert.equal((await invoke({ page: '1', limit: '101' })).status, 400);
  assert.equal((await invoke({ page: '1', limit: '10', sort: 'password' })).status, 400);
});

test('auth middleware rejects missing and expired sessions before user lookup', async () => {
  const invoke = async (authorization) => {
    const req = { cookies: {}, headers: authorization ? { authorization } : {} };
    let statusCode;
    let body;
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { body = data; return this; },
    };
    let calledNext = false;
    await protect(req, res, () => { calledNext = true; });
    return { statusCode, body, calledNext };
  };

  assert.equal((await invoke()).statusCode, 401);
  process.env.JWT_SECRET = 'phase1-test-secret';
  const expired = jwt.sign({ id: '000000000000000000000001' }, process.env.JWT_SECRET, { expiresIn: -1 });
  const result = await invoke(`Bearer ${expired}`);
  assert.equal(result.statusCode, 401);
  assert.equal(result.calledNext, false);
});

test('login token is issued only as an HttpOnly cookie, not in the response body', () => {
  process.env.JWT_SECRET = 'phase1-test-secret';
  let responseBody;
  let cookie;
  const res = {
    status() { return this; },
    cookie(name, value, options) { cookie = { name, value, options }; return this; },
    json(body) { responseBody = body; return this; },
  };
  sendTokenResponse({ _id: '000000000000000000000001', toJSON: () => ({ email: 'user@example.com' }) }, 200, res);
  assert.equal(cookie.name, 'jwt');
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(responseBody.token, undefined);
  assert.equal(responseBody.user.email, 'user@example.com');
});
