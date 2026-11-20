const Problem = require('../models/Problem');
const Activity = require('../models/Activity');

const APP_TIME_ZONE = (() => {
  const requested = process.env.APP_TIME_ZONE || 'Asia/Kolkata';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: requested });
    return requested;
  } catch {
    return 'Asia/Kolkata';
  }
})();
const dayKey = (value, timeZone = APP_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const dateFromDayKey = (key) => new Date(`${key}T00:00:00.000Z`);
const dayNumber = (key) => Date.parse(`${key}T00:00:00.000Z`) / 86400000;

const summarizeStreak = (keys, now = new Date(), timeZone = APP_TIME_ZONE) => {
  const ordered = [...new Set(keys)].sort();
  if (!ordered.length) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const key of ordered) {
    run = previous !== null && dayNumber(key) === dayNumber(previous) + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = key;
  }

  const todayKey = dayKey(now, timeZone);
  const yesterday = new Date(`${todayKey}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const activeThrough = ordered.includes(todayKey) ? todayKey : yesterday.toISOString().slice(0, 10);
  let currentStreak = 0;
  let cursor = dayNumber(activeThrough);
  const set = new Set(ordered.map(dayNumber));
  while (set.has(cursor)) {
    currentStreak += 1;
    cursor -= 1;
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: dateFromDayKey(ordered[ordered.length - 1]),
  };
};

const getProgressSummary = async (userId, now = new Date()) => {
  const [counts, solvedDays] = await Promise.all([
    Problem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          solvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['Solved', 'Revised']] }, 1, 0] },
          },
          easyCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$difficulty', 'Easy'] }, { $in: ['$status', ['Solved', 'Revised']] }] }, 1, 0] },
          },
          mediumCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$difficulty', 'Medium'] }, { $in: ['$status', ['Solved', 'Revised']] }] }, 1, 0] },
          },
          hardCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$difficulty', 'Hard'] }, { $in: ['$status', ['Solved', 'Revised']] }] }, 1, 0] },
          },
        },
      },
    ]),
    Problem.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ['Solved', 'Revised'] },
          dateSolved: { $type: 'date' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateSolved', timezone: APP_TIME_ZONE } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    totalProblems: counts[0]?.totalProblems || 0,
    solvedCount: counts[0]?.solvedCount || 0,
    easyCount: counts[0]?.easyCount || 0,
    mediumCount: counts[0]?.mediumCount || 0,
    hardCount: counts[0]?.hardCount || 0,
    ...summarizeStreak(solvedDays.map(({ _id }) => _id), now),
  };
};

// Activity is a cache of solve-date data. Keep notes and existing records intact;
// update stale rows to zero rather than deleting user data.
const reconcileActivity = async (userId) => {
  const days = await Problem.aggregate([
    {
      $match: {
        user: userId,
        status: { $in: ['Solved', 'Revised'] },
        dateSolved: { $type: 'date' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateSolved', timezone: APP_TIME_ZONE } },
        problemsSolved: { $sum: 1 },
        minutesStudied: { $sum: '$timeTaken' },
        problems: { $addToSet: '$_id' },
      },
    },
  ]);

  const activeKeys = new Set(days.map((day) => day._id));
  const existing = await Activity.find({ user: userId }).select('_id date dayKey').lean();
  for (const day of days) {
    let row = existing.find((candidate) => candidate.dayKey === day._id)
      || existing.find((candidate) => !candidate.dayKey && dayKey(candidate.date) === day._id);
    if (row && !row.dayKey) {
      try {
        await Activity.updateOne({ _id: row._id, user: userId, dayKey: { $exists: false } }, { $set: { dayKey: day._id } });
      } catch (error) {
        if (error.code !== 11000) throw error;
        row = await Activity.findOne({ user: userId, dayKey: day._id }).lean();
      }
    }
    const filter = row ? { _id: row._id, user: userId } : { user: userId, dayKey: day._id };
    const update = {
      $set: {
        dayKey: day._id,
        date: dateFromDayKey(day._id),
        problemsSolved: day.problemsSolved,
        minutesStudied: day.minutesStudied,
        problems: day.problems,
      },
      $setOnInsert: { notes: '' },
    };
    try {
      await Activity.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    } catch (error) {
      if (error.code !== 11000 || row) throw error;
      // Another request inserted this user's calendar day after our snapshot.
      await Activity.findOneAndUpdate({ user: userId, dayKey: day._id }, update, { new: true });
    }
  }

  for (const row of existing) {
    if (activeKeys.has(row.dayKey || dayKey(row.date))) continue;
    await Activity.updateOne(
      { _id: row._id, user: userId },
      { $set: { problemsSolved: 0, minutesStudied: 0, problems: [] } },
    );
  }
};

module.exports = { APP_TIME_ZONE, dayKey, dateFromDayKey, summarizeStreak, getProgressSummary, reconcileActivity };
