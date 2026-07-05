const Goal = require('../models/Goal');
const Problem = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const getPeriodStart = (type) => {
  const now = new Date();
  if (type === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (type === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  if (type === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const types = ['daily', 'weekly', 'monthly'];
    const goals = await Promise.all(
      types.map(async (type) => {
        const period = getPeriodStart(type);
        let goal = await Goal.findOne({ user: req.user._id, type, period });

        if (!goal) {
          // Return default goal structure if none set
          return { type, period, target: 0, achieved: 0, isCompleted: false };
        }

        // Recalculate achieved from actual solved problems
        const periodEnd = new Date(period);
        if (type === 'daily') periodEnd.setDate(periodEnd.getDate() + 1);
        if (type === 'weekly') periodEnd.setDate(periodEnd.getDate() + 7);
        if (type === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);

        const achieved = await Problem.countDocuments({
          user: req.user._id,
          status: { $in: ['Solved', 'Revised'] },
          dateSolved: { $gte: period, $lt: periodEnd },
        });

        goal.achieved = achieved;
        goal.isCompleted = achieved >= goal.target;
        await goal.save();

        return goal;
      })
    );

    return successResponse(res, goals, 'Goals fetched');
  } catch (error) {
    next(error);
  }
};

const setGoal = async (req, res, next) => {
  try {
    const { type, target } = req.body;
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return errorResponse(res, 'Invalid goal type', 400);
    }

    const period = getPeriodStart(type);
    const goal = await Goal.findOneAndUpdate(
      { user: req.user._id, type, period },
      { target, achieved: 0, isCompleted: false },
      { upsert: true, new: true }
    );

    return successResponse(res, goal, 'Goal set');
  } catch (error) {
    next(error);
  }
};

module.exports = { getGoals, setGoal };