const {
  fetchProblemDetails,
  checkDuplicate,
  saveProblem,
} = require('../services/fetchProblem');

const { generateRevisionSchedule } = require('../services/revisionService');
const { reconcileActivity } = require('../services/progressService');

const Revision  = require('../models/Revision');

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
  let createdProblem;
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
      dateSolved: status === 'Solved' ? new Date() : null,
    });
    createdProblem = problem;

    // Create revision schedule if solved
    if (status === 'Solved') {
      const scheduledDates = generateRevisionSchedule(problem.dateSolved);
      await Revision.create({
        user:           req.user._id,
        problem:        problem._id,
        scheduledDates,
        currentStep:    0,
      });
    }

    await reconcileActivity(req.user._id);

    return successResponse(res, problem, 'Problem saved successfully!', 201);
  } catch (error) {
    if (createdProblem) {
      await Revision.deleteOne({ user: req.user._id, problem: createdProblem._id }).catch(() => {});
      await createdProblem.deleteOne().catch(() => {});
    }
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
