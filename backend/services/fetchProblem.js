/**
 * Fetch Problem Orchestrator
 * Coordinates between platform services and the database.
 */

const { getPlatformService } = require('./platforms/index');
const Problem = require('../models/Problem');

/**
 * Fetch problem details from the appropriate platform API.
 * Does NOT save to DB — just returns the fetched data for preview.
 */
const fetchProblemDetails = async (platform, identifier) => {
  const service = getPlatformService(platform);
  const details = await service.fetchProblem(identifier);
  return details;
};

/**
 * Check if user has already added this problem.
 */
const checkDuplicate = async (userId, platform, problemId, slug) => {
  const existing = await Problem.findOne({
    user: userId,
    platform,
    $or: [
      { problemId: String(problemId) },
      { slug },
    ],
  });
  return existing;
};

/**
 * Save fetched problem to MongoDB.
 */
const saveProblem = async (userId, fetchedData, extraData = {}) => {
  const {
    platform, problemId, slug, title,
    difficulty, topic, url,
  } = fetchedData;

  const problem = await Problem.create({
    user:        userId,
    platform,
    problemId,
    slug,
    title,
    difficulty,
    topic,
    problemLink: url,
    status:      extraData.status      || 'Solved',
    dateSolved:  extraData.dateSolved  || new Date(),
    notes:       extraData.notes       || '',
    isFavorite:  extraData.isFavorite  || false,
    timeTaken:   extraData.timeTaken   || 0,
    attempts:    extraData.attempts    || 1,
    companies:   extraData.companies   || [],
    tags:        extraData.tags        || [],
  });

  return problem;
};

module.exports = { fetchProblemDetails, checkDuplicate, saveProblem };