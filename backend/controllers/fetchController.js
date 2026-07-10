const {
  fetchProblemDetails,
  checkDuplicate,
  saveProblem,
} = require('../services/fetchProblem');

const { updateStreak } = require('../services/streakService');
const { generateRevisionSchedule } = require('../services/revisionService');

const Revision  = require('../models/Revision');
const Activity  = require('../models/Activity');
const User      = require('../models/User');

const { successResponse, errorResponse } = require('../utils/responseUtils');

/**
 * POST /api/fetch/preview
 * Fetch problem details from platform API for preview.
 * Does NOT save to DB.
 */
const previewProblem = async (req, res, next) => {
  try {
    const { platform, identifier } = req.body;

    const details = await fetchProblemDetails(platform, identifier.trim());

    // Check for duplicate before showing preview
    const duplicate = await checkDuplicate(
      req.user._id,
      details.platform,
      details.problemId,
      details.slug
    );

    return successResponse(res, {
      ...details,
      alreadyAdded: !!duplicate,
      existingId:   duplicate?._id || null,
    }, 'Problem details fetched');
  } catch (error) {
    // Distinguish between "not found" and server errors
    if (
      error.message.includes('not found') ||
      error.message.includes('not supported') ||
      error.message.includes('Premium')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * POST /api/fetch/save
 * Save the fetched problem to MongoDB.
 * Handles streak, revision schedule, and activity.
 */
const saveFetchedProblem = async (req, res, next) => {
  try {
    const {
      platform, identifier,
      notes, timeTaken, attempts,
      isFavorite, companies, tags,
      status = 'Solved',
    } = req.body;

    // Re-fetch to ensure data integrity (don't trust client-sent problem data)
    const details = await fetchProblemDetails(platform, identifier.trim());

    // Duplicate check
    const duplicate = await checkDuplicate(
      req.user._id,
      details.platform,
      details.problemId,
      details.slug
    );

    if (duplicate) {
      return errorResponse(
        res,
        `You have already added "${details.title}". Check your problem list.`,
        409
      );
    }

    // Save problem
    const problem = await saveProblem(req.user._id, details, {
      status,
      notes,
      timeTaken,
      attempts,
      isFavorite,
      companies,
      tags,
      dateSolved: new Date(),
    });

    // Create revision schedule if solved
    if (status === 'Solved') {
      const scheduledDates = generateRevisionSchedule(new Date());
      await Revision.create({
        user:           req.user._id,
        problem:        problem._id,
        scheduledDates,
        currentStep:    0,
      });
    }

    // Update streak and total problems
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
        $inc: { problemsSolved: 1, minutesStudied: Number(timeTaken) || 0 },
        $push: { problems: problem._id },
      },
      { upsert: true, new: true }
    );

    return successResponse(res, problem, 'Problem saved successfully!', 201);
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('not supported') ||
      error.message.includes('Premium')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = { previewProblem, saveFetchedProblem };