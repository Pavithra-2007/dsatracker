const { DIFFICULTY, TOPICS } = require('../config/constants');

const normalizeAndDeduplicate = (fetchedProblems, existingProblems = []) => {
  const existing = new Set(existingProblems.flatMap(({ slug, problemId }) => [slug, problemId].filter(Boolean).map(String)));
  const seen = new Set();
  const valid = [];
  const records = [];
  let invalid = 0;

  for (const problem of fetchedProblems) {
    const slug = String(problem.slug || '').trim();
    const problemId = String(problem.problemId || '').trim();
    const date = problem.dateSolved == null ? null : new Date(problem.dateSolved);
    if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/i.test(slug)
      || !problemId || problemId.length > 32
      || typeof problem.title !== 'string' || !problem.title.trim() || problem.title.length > 200
      || !DIFFICULTY.includes(problem.difficulty)
      || !TOPICS.includes(problem.topic || 'Uncategorized')
      || (date !== null && (!Number.isFinite(date.getTime()) || date > new Date()))) {
      invalid += 1;
      continue;
    }

    if (seen.has(slug) || seen.has(problemId)) continue;
    seen.add(slug);
    seen.add(problemId);
    const normalized = { ...problem, slug, problemId, title: problem.title.trim(), topic: problem.topic || 'Uncategorized', dateSolved: date };
    records.push(normalized);
    if (!existing.has(slug) && !existing.has(problemId)) valid.push(normalized);
  }
  return { problems: valid, records, invalid };
};

const buildSolveDateUpdates = (records, existingProblems) => {
  const existing = new Map();
  for (const problem of existingProblems) {
    if (problem.slug) existing.set(String(problem.slug), problem);
    if (problem.problemId) existing.set(String(problem.problemId), problem);
  }
  return records.flatMap((record) => {
    const found = existing.get(record.slug) || existing.get(record.problemId);
    if (!found || !record.dateSolved || !['Solved', 'Revised'].includes(found.status)) return [];
    if (found.dateSolved && new Date(found.dateSolved).getTime() === record.dateSolved.getTime()) return [];
    return [{ _id: found._id, dateSolved: record.dateSolved }];
  });
};

module.exports = { normalizeAndDeduplicate, buildSolveDateUpdates };
