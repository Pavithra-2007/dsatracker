const Revision  = require('../models/Revision');
const Problem   = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { REVISION_INTERVALS } = require('../config/constants');

/**
 * GET /api/revision
 * Returns due + overdue revisions only (used by dashboard card).
 */
const getRevisions = async (req, res, next) => {
  try {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const revisions = await Revision.find({
      user:       req.user._id,
      isComplete: false,
    }).populate('problem', 'title topic difficulty platform status problemLink slug');

    const due = revisions.filter((r) => {
      const next = r.scheduledDates[r.currentStep];
      return next && next <= endOfDay;
    });

    return successResponse(res, due, 'Revisions fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/revision/all
 * Returns ALL revisions grouped: overdue, dueToday, upcoming, completed.
 * Used by the Revision page tabs.
 */
const getAllRevisions = async (req, res, next) => {
  try {
    const now        = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const all = await Revision.find({
      user: req.user._id,
    }).populate('problem', 'title topic difficulty platform status problemLink slug');

    const overdue   = [];
    const dueToday  = [];
    const upcoming  = [];
    const completed = [];

    for (const r of all) {
      if (r.isComplete) {
        completed.push(r);
        continue;
      }

      const nextDate = r.scheduledDates?.[r.currentStep];
      if (!nextDate) {
        completed.push(r);
        continue;
      }

      const d = new Date(nextDate);
      if (d < startOfDay) {
        overdue.push(r);
      } else if (d >= startOfDay && d <= endOfDay) {
        dueToday.push(r);
      } else {
        upcoming.push(r);
      }
    }

    // Sort upcoming by nearest date first
    upcoming.sort((a, b) =>
      new Date(a.scheduledDates[a.currentStep]) -
      new Date(b.scheduledDates[b.currentStep])
    );

    return successResponse(res, {
      overdue,
      dueToday,
      upcoming,
      completed,
      stats: {
        overdue:   overdue.length,
        dueToday:  dueToday.length,
        upcoming:  upcoming.length,
        completed: completed.length,
        total:     all.length,
      },
    }, 'All revisions fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/revision/:id/mark
 * Mark current revision step as done. Advance to next step.
 */
const markRevised = async (req, res, next) => {
  try {
    const revision = await Revision.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });
    if (!revision) return errorResponse(res, 'Revision not found', 404);

    revision.completedDates.push(new Date());
    revision.currentStep += 1;

    if (revision.currentStep >= REVISION_INTERVALS.length) {
      revision.isComplete = true;
    }

    await revision.save();

    await Problem.findByIdAndUpdate(revision.problem, {
      lastRevised:      new Date(),
      $inc:             { revisionCount: 1 },
      nextRevisionDate: revision.isComplete
        ? null
        : revision.scheduledDates[revision.currentStep],
      status: revision.isComplete ? 'Revised' : 'Revised',
    });

    return successResponse(res, revision, 'Marked as revised');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/revision/:id/skip
 * Postpone current step by 2 days.
 */
const skipRevision = async (req, res, next) => {
  try {
    const revision = await Revision.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });
    if (!revision) return errorResponse(res, 'Revision not found', 404);

    revision.skippedCount += 1;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    revision.scheduledDates[revision.currentStep] = newDate;
    revision.markModified('scheduledDates');
    await revision.save();

    return successResponse(res, revision, 'Revision rescheduled by 2 days');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevisions, getAllRevisions, markRevised, skipRevision };