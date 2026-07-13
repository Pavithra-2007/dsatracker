const { fetchSolvedProblems } = require('../services/platforms/leetcodeSync');
const { generateRevisionSchedule } = require('../services/revisionService');
const { updateStreak } = require('../services/streakService');

const Problem  = require('../models/Problem');
const Revision = require('../models/Revision');
const Activity = require('../models/Activity');
const User     = require('../models/User');

const { successResponse, errorResponse } = require('../utils/responseUtils');

/**
 * POST /api/sync/leetcode
 * Sync solved problems from user's LeetCode account.
 */
const syncLeetCode = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get username from request body or from saved profile
    let { username } = req.body;

    if (!username || !username.trim()) {
      // Try to use saved profile username
      const user = await User.findById(userId);
      username = user?.codingProfiles?.leetcode?.username;
    }

    if (!username || !username.trim()) {
      return errorResponse(
        res,
        'LeetCode username is required. Save it in your Coding Profile first.',
        400
      );
    }

    const syncStart = new Date();

    // Fetch solved problems from LeetCode
    const fetchedProblems = await fetchSolvedProblems(username.trim());

    if (fetchedProblems.length === 0) {
      return successResponse(res, {
        imported:  0,
        skipped:   0,
        total:     0,
        syncTime:  new Date() - syncStart,
        username,
      }, 'No new problems found on LeetCode');
    }

    // Compare with existing problems in MongoDB
    const existingSlugs = await Problem.find(
      { user: userId, platform: 'LeetCode' },
      { slug: 1, problemId: 1 }
    ).lean();

    const existingSet = new Set([
      ...existingSlugs.map((p) => p.slug),
      ...existingSlugs.map((p) => p.problemId),
    ]);

    // Filter only new problems
    const newProblems = fetchedProblems.filter(
      (p) => !existingSet.has(p.slug) && !existingSet.has(p.problemId)
    );

    const skipped = fetchedProblems.length - newProblems.length;

    if (newProblems.length === 0) {
      return successResponse(res, {
        imported:  0,
        skipped,
        total:     fetchedProblems.length,
        syncTime:  new Date() - syncStart,
        username,
        message:   'All problems already exist in your tracker',
      }, 'Already up to date!');
    }

    // Save new problems to MongoDB
    const savedProblems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const p of newProblems) {
      try {
        const problem = await Problem.create({
          user:        userId,
          platform:    p.platform,
          problemId:   p.problemId,
          slug:        p.slug,
          title:       p.title,
          difficulty:  p.difficulty,
          topic:       p.topic,
          problemLink: p.url,
          status:      'Solved',
          dateSolved:  new Date(),
        });

        // Create revision schedule
        const scheduledDates = generateRevisionSchedule(new Date());
        await Revision.create({
          user:           userId,
          problem:        problem._id,
          scheduledDates,
          currentStep:    0,
        });

        savedProblems.push(problem);
      } catch {
        // Skip problems that fail individually
        continue;
      }
    }

    // Update streak and total problems
    if (savedProblems.length > 0) {
      const user = await User.findById(userId);
      updateStreak(user);
      user.totalProblems += savedProblems.length;
      await user.save();

      // Update today's activity
      await Activity.findOneAndUpdate(
        { user: userId, date: today },
        {
          $inc: {
            problemsSolved: savedProblems.length,
          },
          $push: {
            problems: { $each: savedProblems.map((p) => p._id) },
          },
        },
        { upsert: true, new: true }
      );
    }

    const syncTime = new Date() - syncStart;

    return successResponse(res, {
      imported:  savedProblems.length,
      skipped,
      total:     fetchedProblems.length,
      syncTime,
      username,
      problems:  savedProblems.map((p) => ({
        title:      p.title,
        difficulty: p.difficulty,
        topic:      p.topic,
      })),
    }, `Synced ${savedProblems.length} new problems from LeetCode!`);

  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('username is required')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = { syncLeetCode };