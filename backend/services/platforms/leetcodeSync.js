const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

/**
 * Browser-like headers required by LeetCode.
 * Without User-Agent, LeetCode returns HTML instead of JSON → 500 crash.
 */
const getHeaders = (sessionCookie) => ({
  'Content-Type':   'application/json',
  'User-Agent':     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer':        'https://leetcode.com',
  'Origin':         'https://leetcode.com',
  'Accept':         'application/json, text/plain, */*',
  'Accept-Language':'en-US,en;q=0.9',
  ...(sessionCookie ? { Cookie: `LEETCODE_SESSION=${sessionCookie}` } : {}),
});

/**
 * Safe fetch — handles HTML error pages from LeetCode gracefully.
 */
const safeFetch = async (body, sessionCookie) => {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method:  'POST',
    headers: getHeaders(sessionCookie),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`LeetCode API returned status ${res.status}`);
  }

  const text = await res.text();

  // LeetCode returns HTML on rate-limit or block
  if (text.trim().startsWith('<')) {
    throw new Error('LeetCode blocked the request. Wait a moment and try again.');
  }

  return JSON.parse(text);
};

/**
 * Verify user exists on LeetCode.
 */
const verifyUser = async (username) => {
  const data = await safeFetch({
    query: `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username },
  });

  if (!data?.data?.matchedUser) {
    throw new Error(`LeetCode user "${username}" not found. Check the username.`);
  }

  return data.data.matchedUser;
};

const LEETCODE_PAGE_SIZE = 100;

/** Fetch every accepted question using LeetCode's paginated solved-problem list. */
const verifySessionUser = async (username, sessionCookie) => {
  const data = await safeFetch({
    query: '{ userStatus { isSignedIn username } }',
  }, sessionCookie);
  const signedInUser = data?.data?.userStatus;
  if (!signedInUser?.isSignedIn || signedInUser.username?.toLowerCase() !== username.toLowerCase()) {
    throw new Error('The LeetCode session is invalid or belongs to a different username.');
  }
};

const fetchAllAcceptedQuestions = async (sessionCookie) => {
  const questions = [];
  let total = Infinity;

  while (questions.length < total) {
    const skip = questions.length;
    const data = await safeFetch({
      query: `
        query userProfileQuestions(
          $status: StatusFilterEnum!
          $skip: Int!
          $first: Int!
          $sortField: SortFieldEnum!
          $sortOrder: SortingOrderEnum!
          $keyword: String
          $difficulty: [DifficultyEnum!]
        ) {
          userProfileQuestions(
            status: $status
            skip: $skip
            first: $first
            sortField: $sortField
            sortOrder: $sortOrder
            keyword: $keyword
            difficulty: $difficulty
          ) {
            totalNum
            questions {
              frontendId
              titleSlug
              title
              translatedTitle
              difficulty
              lastSubmittedAt
            }
          }
        }
      `,
      variables: {
        status: 'ACCEPTED',
        skip,
        first: LEETCODE_PAGE_SIZE,
        sortField: 'LAST_SUBMITTED_AT',
        sortOrder: 'DESCENDING',
        keyword: null,
        difficulty: [],
      },
    }, sessionCookie);

    const page = data?.data?.userProfileQuestions;
    if (!page || !Array.isArray(page.questions)) {
      const message = data?.errors?.[0]?.message || 'LeetCode returned an invalid solved-problem list';
      throw new Error(message);
    }

    total = Number(page.totalNum) || 0;
    if (page.questions.length === 0) break;
    questions.push(...page.questions);
  }

  return questions;
};

/**
 * Main function — fetch every accepted problem for a username.
 */
const fetchSolvedProblems = async (username, sessionCookie) => {
  if (!username?.trim()) {
    throw new Error('LeetCode username is required');
  }
  if (!sessionCookie?.trim()) {
    throw new Error('A LeetCode session cookie is required to import all solved problems.');
  }

  // Step 1 — verify user exists
  await verifyUser(username);
  await verifySessionUser(username.trim(), sessionCookie.trim());

  const questions = await fetchAllAcceptedQuestions(sessionCookie.trim());
  const uniqueQuestions = new Map(
    questions
      .filter((question) => question.titleSlug && question.frontendId)
      .map((question) => [question.titleSlug, question])
  );

  return [...uniqueQuestions.values()].map((question) => {
    let dateSolved = null;
    if (question.lastSubmittedAt !== undefined && question.lastSubmittedAt !== null) {
      const numericTimestamp = typeof question.lastSubmittedAt === 'number'
        ? question.lastSubmittedAt
        : (/^\d+$/.test(String(question.lastSubmittedAt)) ? Number(question.lastSubmittedAt) : null);
      const timestamp = numericTimestamp === null
        ? question.lastSubmittedAt
        : (numericTimestamp < 1000000000000 ? numericTimestamp * 1000 : numericTimestamp);
      const parsed = new Date(timestamp);
      if (Number.isFinite(parsed.getTime())) dateSolved = parsed;
    }
    const rawDifficulty = String(question.difficulty || '').toLowerCase();
    return {
      platform: 'LeetCode',
      problemId: String(question.frontendId),
      slug: question.titleSlug,
      title: question.translatedTitle || question.title,
      difficulty: rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1),
      // This endpoint does not include topic tags; never invent topic metadata.
      topic: 'Uncategorized',
      topicAvailable: false,
      dateSolved,
      url: `https://leetcode.com/problems/${question.titleSlug}/`,
    };
  });
};
/**
 * Fetch LeetCode contest history for a user.
 */
const fetchContestHistory = async (username) => {
  const data = await safeFetch({
    query: `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
        }
        userContestRankingHistory(username: $username) {
          attended
          trendDirection
          problemsSolved
          totalProblems
          finishTimeInSeconds
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `,
    variables: { username },
  });

  const history = data?.data?.userContestRankingHistory || [];
  const ranking = data?.data?.userContestRanking || null;

  // Only return contests user actually attended
  const attended = history.filter((c) => c.attended);

  return {
    ranking,
    contests: attended.map((c) => ({
      name:          c.contest.title,
      platform:      'LeetCode',
      date:          new Date(c.contest.startTime * 1000),
      rank:          c.ranking,
      solved:        c.problemsSolved,
      totalProblems: c.totalProblems,
      ratingAfter:   Math.round(c.rating),
      ratingChange:  0, // calculated below
      finishTime:    c.finishTimeInSeconds,
    })),
  };
};

module.exports = { fetchSolvedProblems, verifyUser, fetchContestHistory };
