/**
 * LeetCode Platform Service
 * Uses LeetCode's public GraphQL API to fetch problem details.
 * No authentication required for public problem data.
 */

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

/**
 * Fetch problem by slug or problem number.
 * If a number is passed, we first resolve it to a slug.
 */
const fetchProblem = async (identifier) => {
  // Determine if identifier is a number or slug
  const isNumber = /^\d+$/.test(String(identifier).trim());

  let slug;

  if (isNumber) {
    slug = await resolveSlugFromNumber(parseInt(identifier));
  } else {
    slug = identifier.trim().toLowerCase();
  }

  if (!slug) {
    throw new Error(`Problem not found for identifier: ${identifier}`);
  }

  return await fetchBySlug(slug);
};

/**
 * Resolve a problem number to its slug using LeetCode's problem set query.
 */
const resolveSlugFromNumber = async (questionFrontendId) => {
  const query = `
    query problemsetQuestionList($skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: ""
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          frontendQuestionId: questionFrontendId
          titleSlug
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
    },
    body: JSON.stringify({
      query,
      variables: {
        skip: questionFrontendId - 1,
        limit: 1,
        filters: {},
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to LeetCode API');
  }

  const data = await response.json();
  const questions = data?.data?.problemsetQuestionList?.questions;

  if (!questions || questions.length === 0) {
    throw new Error(`Problem number ${questionFrontendId} not found on LeetCode`);
  }

  // Verify the returned question matches our requested ID
  const match = questions.find(
    (q) => String(q.frontendQuestionId) === String(questionFrontendId)
  );

  if (!match) {
    throw new Error(`Problem number ${questionFrontendId} not found on LeetCode`);
  }

  return match.titleSlug;
};

/**
 * Fetch full problem details by slug.
 */
const fetchBySlug = async (slug) => {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
        isPaidOnly
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
    },
    body: JSON.stringify({
      query,
      variables: { titleSlug: slug },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to LeetCode API');
  }

  const data = await response.json();
  const question = data?.data?.question;

  if (!question) {
    throw new Error(`Problem "${slug}" not found on LeetCode`);
  }

  if (question.isPaidOnly) {
    throw new Error('This is a LeetCode Premium problem and cannot be fetched');
  }

  // Map LeetCode topic tags to our predefined topics
  const mappedTopic = mapLeetCodeTopic(question.topicTags);

  return {
    platform:   'LeetCode',
    problemId:  String(question.questionFrontendId),
    slug:       question.titleSlug,
    title:      question.title,
    difficulty: question.difficulty,   // Easy / Medium / Hard — matches our schema
    topic:      mappedTopic,
    topics:     question.topicTags.map((t) => t.name),
    url:        `https://leetcode.com/problems/${question.titleSlug}/`,
  };
};

/**
 * Map LeetCode topic tags to our predefined topic list.
 * Returns the best matching topic from our schema.
 */
const mapLeetCodeTopic = (topicTags) => {
  const OUR_TOPICS = [
    'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
    'Trees', 'BST', 'Heap', 'Trie', 'Graph', 'DFS', 'BFS',
    'Backtracking', 'Greedy', 'Dynamic Programming', 'Recursion',
    'Bit Manipulation', 'Sliding Window', 'Binary Search', 'Math',
    'Sorting', 'Hashing', 'Prefix Sum',
  ];

  const TAG_MAP = {
    'Array':                  'Arrays',
    'String':                 'Strings',
    'Linked List':            'Linked List',
    'Stack':                  'Stack',
    'Queue':                  'Queue',
    'Tree':                   'Trees',
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
  };

  for (const tag of topicTags) {
    if (TAG_MAP[tag.name]) return TAG_MAP[tag.name];
  }

  return 'Arrays'; // default fallback
};

module.exports = { fetchProblem };