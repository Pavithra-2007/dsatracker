/**
 * Update streak on user document.
 * Call this whenever a user solves a problem.
 */
const updateStreak = (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!user.lastActiveDate) {
    // First ever solve
    user.currentStreak = 1;
    user.longestStreak = 1;
    user.lastActiveDate = today;
    return;
  }

  const last = new Date(user.lastActiveDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already solved today — no change
    return;
  } else if (diffDays === 1) {
    // Consecutive day — increment streak
    user.currentStreak += 1;
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }
  } else {
    // Streak broken
    user.currentStreak = 1;
  }

  user.lastActiveDate = today;
};

/**
 * Check if streak is at risk.
 * Returns true if user solved yesterday but not yet today.
 */
const isStreakAtRisk = (user) => {
  if (!user.lastActiveDate || user.currentStreak === 0) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(user.lastActiveDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

module.exports = { updateStreak, isStreakAtRisk };