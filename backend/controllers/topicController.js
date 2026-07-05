const Problem = require('../models/Problem');
const { TOPICS } = require('../config/constants');
const { successResponse } = require('../utils/responseUtils');

const getTopics = async (req, res, next) => {
  try {
    // Aggregate problems grouped by topic for this user
    const stats = await Problem.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$topic',
          total: { $sum: 1 },
          solved: {
            $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] },
          },
          revised: {
            $sum: { $cond: [{ $eq: ['$status', 'Revised'] }, 1, 0] },
          },
          easy: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] },
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] },
          },
          hard: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] },
          },
        },
      },
    ]);

    // Map all predefined topics and merge with stats
    const statsMap = {};
    stats.forEach((s) => { statsMap[s._id] = s; });

    const topics = TOPICS.map((topic) => {
      const s = statsMap[topic] || {};
      const total = s.total || 0;
      const solved = (s.solved || 0) + (s.revised || 0);
      return {
        name: topic,
        total,
        solved,
        remaining: total - solved,
        progress: total > 0 ? Math.round((solved / total) * 100) : 0,
        easy: s.easy || 0,
        medium: s.medium || 0,
        hard: s.hard || 0,
      };
    });

    return successResponse(res, topics, 'Topics fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTopics };