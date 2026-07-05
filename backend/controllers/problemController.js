const Problem = require('../models/Problem');
const Revision = require('../models/Revision');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { generateRevisionSchedule } = require('../services/revisionService');
const { updateStreak } = require('../services/streakService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseUtils');

const createProblem = async (req, res, next) => {
  try {
    const problem = await Problem.create({ ...req.body, user: req.user._id });

    // If solved, trigger revision schedule + streak
    if (problem.status === 'Solved') {
      const scheduledDates = generateRevisionSchedule(problem.dateSolved || new Date());

      await Revision.create({
        user: req.user._id,
        problem: problem._id,
        scheduledDates,
        currentStep: 0,
      });

      // Update streak and total problems on user
      const user = await User.findById(req.user._id);
      updateStreak(user);
      user.totalProblems += 1;
      await user.save();

      // Upsert today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await Activity.findOneAndUpdate(
        { user: req.user._id, date: today },
        {
          $inc: { problemsSolved: 1, minutesStudied: problem.timeTaken || 0 },
          $push: { problems: problem._id },
        },
        { upsert: true, new: true }
      );
    }

    return successResponse(res, problem, 'Problem created', 201);
  } catch (error) {
    next(error);
  }
};

const getProblems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      topic,
      difficulty,
      status,
      platform,
      company,
      isFavorite,
      isBookmarked,
      search,
      tags,
    } = req.query;

    const filter = { user: req.user._id };

    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (company) filter.companies = company;
    if (isFavorite === 'true') filter.isFavorite = true;
    if (isBookmarked === 'true') filter.isBookmarked = true;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const total = await Problem.countDocuments(filter);
    const problems = await Problem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, problems, total, page, limit);
  } catch (error) {
    next(error);
  }
};

const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!problem) return errorResponse(res, 'Problem not found', 404);
    return successResponse(res, problem, 'Problem fetched');
  } catch (error) {
    next(error);
  }
};

const updateProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!problem) return errorResponse(res, 'Problem not found', 404);

    const wasSolved = problem.status === 'Solved';
    const nowSolved = req.body.status === 'Solved';

    Object.assign(problem, req.body);
    await problem.save();

    // Create revision schedule if newly marked as solved
    if (!wasSolved && nowSolved) {
      const scheduledDates = generateRevisionSchedule(problem.dateSolved || new Date());
      await Revision.findOneAndUpdate(
        { user: req.user._id, problem: problem._id },
        { scheduledDates, currentStep: 0, isComplete: false },
        { upsert: true, new: true }
      );

      const user = await User.findById(req.user._id);
      updateStreak(user);
      user.totalProblems += 1;
      await user.save();
    }

    return successResponse(res, problem, 'Problem updated');
  } catch (error) {
    next(error);
  }
};

const deleteProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!problem) return errorResponse(res, 'Problem not found', 404);

    // Clean up revision
    await Revision.findOneAndDelete({ problem: problem._id, user: req.user._id });

    return successResponse(res, null, 'Problem deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
};