const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const { APP_TIME_ZONE, getProgressSummary, dateFromDayKey } = require('../services/progressService');
const { successResponse } = require('../utils/responseUtils');

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const solved = { $in: ['$status', ['Solved', 'Revised']] };
    const [progress, byTopic, byDifficulty, byPlatform, byCompany, monthly, weekly, contestHistory] = await Promise.all([
      getProgressSummary(userId),
      Problem.aggregate([
        { $match: { user: userId, status: { $in: ['Solved', 'Revised'] } } },
        { $group: { _id: '$topic', count: { $sum: 1 } } }, { $sort: { count: -1 } },
      ]),
      Problem.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$difficulty', total: { $sum: 1 }, solved: { $sum: { $cond: [solved, 1, 0] } } } },
      ]),
      Problem.aggregate([
        { $match: { user: userId } }, { $group: { _id: '$platform', count: { $sum: 1 } } }, { $sort: { count: -1 } },
      ]),
      Problem.aggregate([
        { $match: { user: userId, companies: { $exists: true, $ne: [] } } }, { $unwind: '$companies' },
        { $group: { _id: '$companies', count: { $sum: 1 } } }, { $sort: { count: -1 } },
      ]),
      Problem.aggregate([
        { $match: { user: userId, status: { $in: ['Solved', 'Revised'] }, dateSolved: { $type: 'date' } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$dateSolved', timezone: APP_TIME_ZONE } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } }, { $limit: 6 }, { $sort: { _id: 1 } },
      ]),
      Problem.aggregate([
        { $match: { user: userId, status: { $in: ['Solved', 'Revised'] }, dateSolved: { $type: 'date', $gte: new Date(Date.now() - 56 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%G-W%V', date: '$dateSolved', timezone: APP_TIME_ZONE } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Contest.find({ user: userId }).sort({ date: 1 }).select('name platform rank ratingAfter ratingChange date'),
    ]);

    return successResponse(res, {
      overview: {
        totalProblems: progress.totalProblems,
        solvedCount: progress.solvedCount,
        easyCount: progress.easyCount,
        mediumCount: progress.mediumCount,
        hardCount: progress.hardCount,
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
      },
      byTopic, byDifficulty, byPlatform, byCompany, monthly, weekly, contestHistory,
    }, 'Analytics fetched');
  } catch (error) {
    next(error);
  }
};

const getHeatmap = async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
    const days = await Problem.aggregate([
      { $match: { user: req.user._id, status: { $in: ['Solved', 'Revised'] }, dateSolved: { $gte: oneYearAgo, $type: 'date' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateSolved', timezone: APP_TIME_ZONE } },
          problemsSolved: { $sum: 1 },
          minutesStudied: { $sum: '$timeTaken' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return successResponse(res, days.map(({ _id, ...activity }) => ({ date: dateFromDayKey(_id), ...activity })), 'Heatmap data fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getHeatmap };
