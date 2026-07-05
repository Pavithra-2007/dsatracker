const Problem = require('../models/Problem');
const Activity = require('../models/Activity');
const Contest = require('../models/Contest');
const User = require('../models/User');
const { successResponse } = require('../utils/responseUtils');

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Problems by topic ──────────────────────────────────────────────────
    const byTopic = await Problem.aggregate([
      { $match: { user: userId, status: { $in: ['Solved', 'Revised'] } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Problems by difficulty ─────────────────────────────────────────────
    const byDifficulty = await Problem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$difficulty',
          total: { $sum: 1 },
          solved: {
            $sum: { $cond: [{ $in: ['$status', ['Solved', 'Revised']] }, 1, 0] },
          },
        },
      },
    ]);

    // ── Problems by platform ───────────────────────────────────────────────
    const byPlatform = await Problem.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Problems by company ────────────────────────────────────────────────
    const byCompany = await Problem.aggregate([
      { $match: { user: userId, companies: { $exists: true, $ne: [] } } },
      { $unwind: '$companies' },
      { $group: { _id: '$companies', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Monthly progress — last 6 months ──────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Problem.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ['Solved', 'Revised'] },
          dateSolved: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateSolved' },
            month: { $month: '$dateSolved' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Weekly progress — last 8 weeks ────────────────────────────────────
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const weekly = await Problem.aggregate([
      {
        $match: {
          user: userId,
          status: { $in: ['Solved', 'Revised'] },
          dateSolved: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $week: '$dateSolved' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // ── Overall stats ──────────────────────────────────────────────────────
    const totalProblems = await Problem.countDocuments({ user: userId });

    const solvedCount = await Problem.countDocuments({
      user: userId,
      status: { $in: ['Solved', 'Revised'] },
    });

    const easyCount = await Problem.countDocuments({
      user: userId,
      difficulty: 'Easy',
      status: { $in: ['Solved', 'Revised'] },
    });

    const mediumCount = await Problem.countDocuments({
      user: userId,
      difficulty: 'Medium',
      status: { $in: ['Solved', 'Revised'] },
    });

    const hardCount = await Problem.countDocuments({
      user: userId,
      difficulty: 'Hard',
      status: { $in: ['Solved', 'Revised'] },
    });

    // ── Contest rating history ─────────────────────────────────────────────
    const contestHistory = await Contest.find({ user: userId })
      .sort({ date: 1 })
      .select('name platform rank ratingAfter ratingChange date');

    // ── User streak info ───────────────────────────────────────────────────
    const user = await User.findById(userId).select(
      'currentStreak longestStreak totalProblems lastActiveDate'
    );

    return successResponse(
      res,
      {
        overview: {
          totalProblems,
          solvedCount,
          easyCount,
          mediumCount,
          hardCount,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
        },
        byTopic,
        byDifficulty,
        byPlatform,
        byCompany,
        monthly,
        weekly,
        contestHistory,
      },
      'Analytics fetched'
    );
  } catch (error) {
    next(error);
  }
};

// ── Heatmap — last 365 days ────────────────────────────────────────────────
const getHeatmap = async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const activities = await Activity.find({
      user: req.user._id,
      date: { $gte: oneYearAgo },
    }).select('date problemsSolved minutesStudied');

    return successResponse(res, activities, 'Heatmap data fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getHeatmap };