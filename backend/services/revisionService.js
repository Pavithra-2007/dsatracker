const { REVISION_INTERVALS } = require('../config/constants');

/**
 * Generate scheduled revision dates from a solve date.
 * Returns array of Date objects for D+1, D+3, D+7, D+15, D+30, D+60
 */
const generateRevisionSchedule = (solveDate = new Date()) => {
  const base = new Date(solveDate);
  base.setHours(0, 0, 0, 0);

  return REVISION_INTERVALS.map((days) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  });
};

/**
 * Get the next scheduled date given current step
 */
const getNextRevisionDate = (scheduledDates, currentStep) => {
  if (currentStep >= scheduledDates.length) return null;
  return scheduledDates[currentStep];
};

/**
 * Calculate revision due stats
 */
const calcRevisionStats = (revisions) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dueToday = revisions.filter((r) => {
    if (r.isComplete || r.currentStep >= r.scheduledDates.length) return false;
    const nextDate = r.scheduledDates[r.currentStep];
    return nextDate >= startOfDay && nextDate <= today;
  });

  const overdue = revisions.filter((r) => {
    if (r.isComplete || r.currentStep >= r.scheduledDates.length) return false;
    const nextDate = r.scheduledDates[r.currentStep];
    return nextDate < startOfDay;
  });

  return {
    dueToday: dueToday.length,
    overdue: overdue.length,
  };
};

module.exports = {
  generateRevisionSchedule,
  getNextRevisionDate,
  calcRevisionStats,
};