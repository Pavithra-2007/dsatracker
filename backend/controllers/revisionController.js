const Revision = require('../models/Revision');
const Problem = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { REVISION_INTERVALS } = require('../config/constants');

const getRevisions = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const revisions = await Revision.find({
      user: req.user._id,
      isComplete: false,
    }).populate('problem', 'title topic difficulty platform status');

    // Split into due today and overdue
    const due = revisions.filter((r) => {
      const next = r.scheduledDates[r.currentStep];
      return next && next <= today;
    });

    return successResponse(res, due, 'Revisions fetched');
  } catch (error) {
    next(error);
  }
};

const markRevised = async (req, res, next) => {
  try {
    const revision = await Revision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!revision) return errorResponse(res, 'Revision not found', 404);

    revision.completedDates.push(new Date());
    revision.currentStep += 1;

    if (revision.currentStep >= REVISION_INTERVALS.length) {
      revision.isComplete = true;
    }

    await revision.save();

    // Update problem fields
    await Problem.findByIdAndUpdate(revision.problem, {
      lastRevised: new Date(),
      $inc: { revisionCount: 1 },
      nextRevisionDate: revision.isComplete
        ? null
        : revision.scheduledDates[revision.currentStep],
      status: 'Revised',
    });

    return successResponse(res, revision, 'Marked as revised');
  } catch (error) {
    next(error);
  }
};

const skipRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!revision) return errorResponse(res, 'Revision not found', 404);

    revision.skippedCount += 1;
    // Push next revision date by 2 days from today
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    revision.scheduledDates[revision.currentStep] = newDate;
    await revision.save();

    return successResponse(res, revision, 'Revision skipped');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevisions, markRevised, skipRevision };