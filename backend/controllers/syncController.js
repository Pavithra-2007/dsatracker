const { fetchSolvedProblems, fetchContestHistory } = require('../services/platforms/leetcodeSync');
const { generateRevisionSchedule } = require('../services/revisionService');
const { reconcileActivity } = require('../services/progressService');
const { normalizeAndDeduplicate, buildSolveDateUpdates } = require('../services/leetcodeImportService');

const Problem  = require('../models/Problem');
const Revision = require('../models/Revision');
const User     = require('../models/User');

const { successResponse, errorResponse } = require('../utils/responseUtils');
const LEETCODE_METADATA_NOTICE = 'LeetCode does not provide topic tags or a submission date for every solved problem. Missing topics are labeled Uncategorized and unknown dates are left blank.';

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
    const sessionCookie = req.body.sessionCookie;
    if (typeof sessionCookie !== 'string' || !sessionCookie.trim() || sessionCookie.length > 8192 || /[\r\n;]/.test(sessionCookie)) {
      return errorResponse(res, 'A valid LeetCode session cookie is required to import all solved problems.', 400);
    }

    const fetchedProblems = await fetchSolvedProblems(username.trim(), sessionCookie.trim());

    if (fetchedProblems.length === 0) {
      return successResponse(res, {
        imported:  0,
        skipped:   0,
        total:     0,
        syncTime:  new Date() - syncStart,
        username,
        metadataNotice: LEETCODE_METADATA_NOTICE,
      }, 'No new problems found on LeetCode');
    }

    // Compare with existing problems in MongoDB
    const existingSlugs = await Problem.find(
      { user: userId, platform: 'LeetCode' },
      { slug: 1, problemId: 1, status: 1, dateSolved: 1 }
    ).lean();

    const { problems: newProblems, records, invalid } = normalizeAndDeduplicate(fetchedProblems, existingSlugs);
    const dateUpdates = buildSolveDateUpdates(records, existingSlugs);
    if (dateUpdates.length) {
      await Problem.bulkWrite(dateUpdates.map(({ _id, dateSolved }) => ({
        updateOne: {
          filter: { _id, user: userId, status: { $in: ['Solved', 'Revised'] } },
          update: { $set: { dateSolved } },
        },
      })), { ordered: false });
    }
    const skipped = fetchedProblems.length - newProblems.length;

    if (newProblems.length === 0) {
      if (dateUpdates.length) await reconcileActivity(userId);
      return successResponse(res, {
        imported:  0,
        skipped,
        refreshedDates: dateUpdates.length,
        total:     fetchedProblems.length,
        syncTime:  new Date() - syncStart,
        username,
        message:   'All problems already exist in your tracker',
        metadataNotice: LEETCODE_METADATA_NOTICE,
      }, 'Already up to date!');
    }

    // Save new problems to MongoDB
    const savedProblems = [];
    let failed = 0;

    for (const p of newProblems) {
      let problem;
      try {
        problem = await Problem.create({
          user:        userId,
          platform:    p.platform,
          problemId:   p.problemId,
          slug:        p.slug,
          title:       p.title,
          difficulty:  p.difficulty,
          topic:       p.topic,
          problemLink: p.url,
          status:      'Solved',
          dateSolved:  p.dateSolved,
        });

        if (p.dateSolved) {
          const scheduledDates = generateRevisionSchedule(p.dateSolved);
          await Revision.create({ user: userId, problem: problem._id, scheduledDates, currentStep: 0 });
        }

        savedProblems.push(problem);
      } catch {
        if (problem) {
          await Revision.deleteOne({ user: userId, problem: problem._id });
          await Problem.deleteOne({ _id: problem._id, user: userId });
        }
        failed += 1;
        continue;
      }
    }

    if (savedProblems.length > 0 || dateUpdates.length > 0) {
      await reconcileActivity(userId);
    }

    const syncTime = new Date() - syncStart;

    return successResponse(res, {
      imported:  savedProblems.length,
      skipped,
      failed,
      invalid,
      refreshedDates: dateUpdates.length,
      total:     fetchedProblems.length,
      syncTime,
      username,
      problems:  savedProblems.map((p) => ({
        title:      p.title,
        difficulty: p.difficulty,
        topic:      p.topic,
      })),
      metadataNotice: LEETCODE_METADATA_NOTICE,
    }, `Synced ${savedProblems.length} new problems from LeetCode!`);

  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('username is required') ||
      error.message.includes('session')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

const Contest = require('../models/Contest');

/**
 * POST /api/sync/leetcode/contests
 * Sync contest history from LeetCode.
 */
const syncContests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let { username } = req.body;

    if (!username || !username.trim()) {
      const user = await User.findById(userId);
      username = user?.codingProfiles?.leetcode?.username;
    }

    if (!username || !username.trim()) {
      return errorResponse(res, 'LeetCode username is required.', 400);
    }

    const syncStart = new Date();

    // Fetch contest history from LeetCode
    const { contests: fetched, ranking } = await fetchContestHistory(username.trim());

    if (fetched.length === 0) {
      return successResponse(res, {
        imported: 0, skipped: 0, total: 0,
        syncTime: new Date() - syncStart,
      }, 'No contests found on LeetCode');
    }

    // Get existing contest names to avoid duplicates
    const existing = await Contest.find(
      { user: userId, platform: 'LeetCode' },
      { name: 1 }
    ).lean();

    const existingNames = new Set(existing.map((c) => c.name));

    const newContests = fetched.filter((c) => !existingNames.has(c.name));
    const skipped = fetched.length - newContests.length;

    // Calculate rating changes between consecutive contests
    const sorted = [...newContests].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 1; i < sorted.length; i++) {
      sorted[i].ratingChange = Math.round(sorted[i].ratingAfter - sorted[i - 1].ratingAfter);
    }

    // Save new contests
    const saved = [];
    for (const c of sorted) {
      try {
        const contest = await Contest.create({ ...c, user: userId });
        saved.push(contest);
      } catch {
        continue;
      }
    }

    return successResponse(res, {
      imported:  saved.length,
      skipped,
      total:     fetched.length,
      syncTime:  new Date() - syncStart,
      username,
      ranking,
      contests:  saved.map((c) => ({
        name:        c.name,
        rank:        c.rank,
        ratingAfter: c.ratingAfter,
        date:        c.date,
      })),
    }, `Synced ${saved.length} contests from LeetCode!`);

  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('required')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

module.exports = { syncLeetCode, syncContests };
