const { body } = require('express-validator');

const fetchValidator = [
  body('platform')
    .trim()
    .notEmpty().withMessage('Platform is required')
    .isIn(['LeetCode', 'GeeksforGeeks', 'Codeforces', 'HackerRank'])
    .withMessage('Invalid platform'),

  body('identifier')
    .trim()
    .notEmpty().withMessage('Problem number or slug is required'),
];

const saveValidator = [
  body('platform')
    .trim()
    .notEmpty().withMessage('Platform is required'),

  body('identifier')
    .trim()
    .notEmpty().withMessage('Problem identifier is required'),

  body('notes')
    .optional()
    .isString(),

  body('timeTaken')
    .optional()
    .isNumeric().withMessage('Time taken must be a number'),
];

module.exports = { fetchValidator, saveValidator };