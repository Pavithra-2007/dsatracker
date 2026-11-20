const Problem = require('../models/Problem');
const Revision = require('../models/Revision');
const { generateRevisionSchedule } = require('../services/revisionService');
const { reconcileActivity } = require('../services/progressService');
const { TOPICS, DIFFICULTY, STATUS, PLATFORMS, COMPANIES } = require('../config/constants');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseUtils');

const SOLVED = ['Solved', 'Revised'];
const UPDATEABLE_FIELDS = [
  'title', 'platform', 'difficulty', 'topic', 'subtopic', 'status', 'dateSolved', 'timeTaken', 'attempts',
  'codeLink', 'problemLink', 'notes', 'companies', 'isFavorite', 'isBookmarked', 'tags',
];

const syncRevision = async (userId, problem, previousStatus, previousDate) => {
  if (!SOLVED.includes(problem.status)) {
    await Revision.findOneAndDelete({ user: userId, problem: problem._id });
    problem.nextRevisionDate = null;
    return;
  }

  const dateChanged = String(previousDate || '') !== String(problem.dateSolved || '');
  let revision = await Revision.findOne({ user: userId, problem: problem._id });
  if (problem.status === 'Revised' && (!revision?.isComplete || dateChanged)) {
    problem.status = 'Solved';
  }
  if (!revision || !SOLVED.includes(previousStatus) || problem.status !== previousStatus || dateChanged) {
    const scheduledDates = generateRevisionSchedule(problem.dateSolved || new Date());
    revision = await Revision.findOneAndUpdate(
      { user: userId, problem: problem._id },
      { $set: { scheduledDates, completedDates: [], currentStep: 0, isComplete: false, skippedCount: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  problem.nextRevisionDate = revision.isComplete ? null : revision.scheduledDates[revision.currentStep] || null;
};

const createProblem = async (req, res, next) => {
  let problem;
  try {
    const payload = Object.fromEntries(UPDATEABLE_FIELDS.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (payload.status === 'Solved' && !payload.dateSolved) payload.dateSolved = new Date();
    if (!SOLVED.includes(payload.status)) payload.dateSolved = null;
    problem = await Problem.create({ ...payload, user: req.user._id });
    await syncRevision(req.user._id, problem, null, null);
    await problem.save();
    await reconcileActivity(req.user._id);

    return successResponse(res, problem, 'Problem created', 201);
  } catch (error) {
    if (problem) {
      await Revision.deleteOne({ user: req.user._id, problem: problem._id }).catch(() => {});
      await Problem.deleteOne({ _id: problem._id, user: req.user._id }).catch(() => {});
    }
    next(error);
  }
};

const getProblems = async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      topic,
      difficulty,
      status,
      platform,
      company,
      isFavorite,
      isBookmarked,
      search,
      tags,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    if (typeof page !== 'string' || !Number.isSafeInteger(pageNumber) || pageNumber < 1 || pageNumber > 1000000
      || typeof limit !== 'string' || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return errorResponse(res, 'Page must be positive and page size must be between 1 and 100', 400);
    }
    if (topic && !TOPICS.includes(topic)) return errorResponse(res, 'Invalid topic filter', 400);
    if (difficulty && !DIFFICULTY.includes(difficulty)) return errorResponse(res, 'Invalid difficulty filter', 400);
    if (status && !STATUS.includes(status)) return errorResponse(res, 'Invalid status filter', 400);
    if (platform && !PLATFORMS.includes(platform)) return errorResponse(res, 'Invalid platform filter', 400);
    if (company && !COMPANIES.includes(company)) return errorResponse(res, 'Invalid company filter', 400);
    if (!['createdAt', 'dateSolved', 'title', 'difficulty', 'status'].includes(sort) || !['asc', 'desc'].includes(order)) {
      return errorResponse(res, 'Invalid sort field or order', 400);
    }
    if (search !== undefined && (typeof search !== 'string' || search.length > 100)) return errorResponse(res, 'Search must be at most 100 characters', 400);
    if (tags !== undefined && typeof tags !== 'string') return errorResponse(res, 'Invalid tags filter', 400);
    if (isFavorite !== undefined && !['true', 'false'].includes(isFavorite)) return errorResponse(res, 'Invalid favorite filter', 400);
    if (isBookmarked !== undefined && !['true', 'false'].includes(isBookmarked)) return errorResponse(res, 'Invalid bookmark filter', 400);

    const filter = { user: req.user._id };

    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (company) filter.companies = company;
    if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';
    if (isBookmarked !== undefined) filter.isBookmarked = isBookmarked === 'true';
    if (tags) {
      const values = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      if (!values.length || values.length > 50 || values.some((tag) => tag.length > 50)) return errorResponse(res, 'Invalid tags filter', 400);
      filter.tags = { $in: values };
    }
    if (search) {
      filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const total = await Problem.countDocuments(filter);
    const problems = await Problem.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    return paginatedResponse(res, problems, total, pageNumber, pageSize);
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

    const previousStatus = problem.status;
    const previousDate = problem.dateSolved;
    for (const field of UPDATEABLE_FIELDS) {
      if (req.body[field] !== undefined) problem.set(field, req.body[field]);
    }
    if (SOLVED.includes(problem.status) && req.body.status === 'Solved' && !req.body.dateSolved && !problem.dateSolved) {
      problem.dateSolved = new Date();
    }
    if (!SOLVED.includes(problem.status)) problem.dateSolved = null;
    await syncRevision(req.user._id, problem, previousStatus, previousDate);
    await problem.save();
    await reconcileActivity(req.user._id);

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
    await reconcileActivity(req.user._id);

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
