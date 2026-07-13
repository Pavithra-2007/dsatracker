const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

/**
 * Browser-like headers required by LeetCode.
 * Without User-Agent, LeetCode returns HTML instead of JSON → 500 crash.
 */
const getHeaders = () => ({
  'Content-Type':   'application/json',
  'User-Agent':     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer':        'https://leetcode.com',
  'Origin':         'https://leetcode.com',
  'Accept':         'application/json, text/plain, */*',
  'Accept-Language':'en-US,en;q=0.9',
});

/**
 * Safe fetch — handles HTML error pages from LeetCode gracefully.
 */
const safeFetch = async (body) => {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method:  'POST',
    headers: getHeaders(),
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

/**
 * Fetch last 20 accepted submissions for a user.
 */
const fetchRecentAccepted = async (username) => {
  const data = await safeFetch({
    query: `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `,
    variables: { username, limit: 20 },
  });

  return data?.data?.recentAcSubmissionList || [];
};

/**
 * Fetch full problem details by slug.
 */
const fetchProblemBySlug = async (slug) => {
  const data = await safeFetch({
    query: `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags { name }
          isPaidOnly
        }
      }
    `,
    variables: { titleSlug: slug },
  });

  return data?.data?.question || null;
};

/**
 * Map LeetCode tags to our topic enum.
 */
const mapTopic = (topicTags = []) => {
  const TAG_MAP = {
    'Array':                  'Arrays',
    'String':                 'Strings',
    'Linked List':            'Linked List',
    'Stack':                  'Stack',
    'Queue':                  'Queue',
    'Tree':                   'Trees',
    'Binary Tree':            'Trees',
    'Binary Search Tree':     'BST',
    'Heap (Priority Queue)':  'Heap',
    'Trie':                   'Trie',
    'Graph':                  'Graph',
    'Depth-First Search':     'DFS',
    'Breadth-First Search':   'BFS',
    'Backtracking':           'Backtracking',
    'Greedy':                 'Greedy',
    'Dynamic Programming':    'Dynamic Programming',
    'Recursion':              'Recursion',
    'Bit Manipulation':       'Bit Manipulation',
    'Sliding Window':         'Sliding Window',
    'Binary Search':          'Binary Search',
    'Math':                   'Math',
    'Sorting':                'Sorting',
    'Hash Table':             'Hashing',
    'Prefix Sum':             'Prefix Sum',
    'Two Pointers':           'Arrays',
    'Matrix':                 'Arrays',
  };

  for (const tag of topicTags) {
    if (TAG_MAP[tag.name]) return TAG_MAP[tag.name];
  }

  return 'Arrays';
};

/**
 * Main function — fetch all recently solved problems for a username.
 */
const fetchSolvedProblems = async (username) => {
  if (!username?.trim()) {
    throw new Error('LeetCode username is required');
  }

  // Step 1 — verify user exists
  await verifyUser(username);

  // Step 2 — get recent accepted submissions
  const submissions = await fetchRecentAccepted(username);

  if (submissions.length === 0) return [];

  // Step 3 — deduplicate slugs
  const uniqueSlugs = [...new Set(submissions.map((s) => s.titleSlug))];

  // Step 4 — fetch details for each slug
  const results = [];

  for (const slug of uniqueSlugs) {
    try {
      const q = await fetchProblemBySlug(slug);

      if (q && !q.isPaidOnly) {
        results.push({
          platform:  'LeetCode',
          problemId: String(q.questionFrontendId),
          slug:      q.titleSlug,
          title:     q.title,
          difficulty: q.difficulty,
          topic:     mapTopic(q.topicTags),
          topics:    q.topicTags.map((t) => t.name),
          url:       `https://leetcode.com/problems/${q.titleSlug}/`,
        });
      }

      // Delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.warn(`Skipped slug "${slug}":`, err.message);
      continue;
    }
  }

  return results;
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
