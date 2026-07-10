/**
 * Platform Router
 * Add new platforms here without touching any other file.
 *
 * Each platform module must export:
 *   fetchProblem(identifier) → { platform, problemId, slug, title, difficulty, topic, topics, url }
 */

const leetcode = require('./leetcode');

const PLATFORMS = {
  leetcode: leetcode,
  // gfg:        require('./gfg'),        // add later
  // codeforces: require('./codeforces'), // add later
  // hackerrank: require('./hackerrank'), // add later
};

/**
 * Get the service for a given platform name.
 * Throws if platform is not supported.
 */
const getPlatformService = (platform) => {
  const key = platform.toLowerCase().replace(/\s/g, '');
  const service = PLATFORMS[key];

  if (!service) {
    const supported = Object.keys(PLATFORMS).join(', ');
    throw new Error(
      `Platform "${platform}" is not supported yet. Supported: ${supported}`
    );
  }

  return service;
};

const getSupportedPlatforms = () => Object.keys(PLATFORMS);

module.exports = { getPlatformService, getSupportedPlatforms };