const Revision  = require('../models/Revision');
const Problem   = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { REVISION_INTERVALS } = require('../config/constants');
const { dayKey, dateFromDayKey } = require('../services/progressService');
const { getProblemStatusAfterRevision, isRevisionDue } = require('../services/revisionService');

/**
 * GET /api/revision
 * Returns due + overdue revisions only (used by dashboard card).
 */
const getRevisions = async (req, res, next) => {
  try {
    const today = dayKey(new Date());

    const revisions = await Revision.find({
      user:       req.user._id,
      isComplete: false,
    }).populate('problem', 'title topic difficulty platform status problemLink slug');

    const due = revisions.filter((r) => {
      const next = r.scheduledDates[r.currentStep];
      return next && dayKey(next) <= today;
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
    const today = dayKey(new Date());

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

      const d = dayKey(nextDate);
      if (d < today) {
        overdue.push(r);
      } else if (d === today) {
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
    if (revision.isComplete || revision.currentStep >= revision.scheduledDates.length) {
      return errorResponse(res, 'This revision plan is already complete', 409);
    }
    if (!isRevisionDue(revision.scheduledDates[revision.currentStep])) {
      return errorResponse(res, 'This revision is not due yet', 409);
    }

    const problem = await Problem.findOne({ _id: revision.problem, user: req.user._id });
    if (!problem || !['Solved', 'Revised'].includes(problem.status)) {
      return errorResponse(res, 'This problem is no longer eligible for revision', 409);
    }

    revision.completedDates.push(new Date());
    revision.currentStep += 1;

    if (revision.currentStep >= Math.min(REVISION_INTERVALS.length, revision.scheduledDates.length)) {
      revision.isComplete = true;
    }

    await revision.save();

    problem.set({
      lastRevised: new Date(),
      revisionCount: problem.revisionCount + 1,
      nextRevisionDate: revision.isComplete ? null : revision.scheduledDates[revision.currentStep],
      status: getProblemStatusAfterRevision(revision.isComplete),
    });
    await problem.save();

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
    if (revision.isComplete || revision.currentStep >= revision.scheduledDates.length) {
      return errorResponse(res, 'This revision plan is already complete', 409);
    }
    const newDateKey = dayKey(new Date());
    const newDate = dateFromDayKey(newDateKey);
    newDate.setUTCDate(newDate.getUTCDate() + 2);
    revision.scheduledDates[revision.currentStep] = newDate;
    revision.markModified('scheduledDates');
    await revision.save();

    await Problem.updateOne(
      { _id: revision.problem, user: req.user._id },
      { $set: { nextRevisionDate: newDate } },
    );

    return successResponse(res, revision, 'Revision rescheduled by 2 days');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRevisions, getAllRevisions, markRevised, skipRevision };
