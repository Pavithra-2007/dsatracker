const { body } = require('express-validator');

const problemValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Problem title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium or Hard'),

  body('topic')
    .notEmpty().withMessage('Topic is required'),

  body('status')
    .optional()
    .isIn(['Not Started', 'Solved', 'Revised', 'Need Revision'])
    .withMessage('Invalid status value'),

  body('platform')
    .optional()
    .isIn(['LeetCode', 'Codeforces', 'GeeksForGeeks', 'HackerRank', 'CodeChef', 'AtCoder', 'Custom'])
    .withMessage('Invalid platform'),

  body('timeTaken')
    .optional()
    .isNumeric().withMessage('Time taken must be a number'),

  body('attempts')
    .optional()
    .isInt({ min: 1 }).withMessage('Attempts must be at least 1'),
];

module.exports = { problemValidator };