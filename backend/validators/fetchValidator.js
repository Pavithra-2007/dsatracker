const { body } = require('express-validator');
const { COMPANIES } = require('../config/constants');
const fetchPlatforms = ['LeetCode'];

const fetchValidator = [
  body('platform')
    .trim()
    .notEmpty().withMessage('Platform is required')
    .isIn(fetchPlatforms)
    .withMessage('Invalid platform'),

  body('identifier')
    .trim()
    .notEmpty().withMessage('Problem number or slug is required')
    .isLength({ max: 200 }).withMessage('Problem identifier is too long'),
];

const saveValidator = [
  body('platform')
    .trim()
    .notEmpty().withMessage('Platform is required')
    .isIn(fetchPlatforms).withMessage('Unsupported platform'),

  body('identifier')
    .trim()
    .notEmpty().withMessage('Problem identifier is required'),

  body('timeTaken')
    .optional()
    .isFloat({ min: 0, max: 100000 }).withMessage('Time taken must be a non-negative number'),

  body('status').optional().isIn(['Not Started', 'Solved', 'Need Revision'])
    .withMessage('Status must be Not Started, Solved or Need Revision'),

  body('attempts').optional().isInt({ min: 1, max: 10000 })
    .withMessage('Attempts must be between 1 and 10000'),

  body('notes').optional().isString().isLength({ max: 10000 }),
  body('companies').optional().isArray({ max: COMPANIES.length }).withMessage('Companies must be a list')
    .custom((items) => items.every((item) => COMPANIES.includes(item))).withMessage('Invalid company'),
  body('tags').optional().isArray({ max: 50 }).withMessage('Tags must be a list')
    .custom((items) => items.every((item) => typeof item === 'string' && item.length <= 50)).withMessage('Tags must be text up to 50 characters'),
  body('isFavorite').optional().isBoolean(),
];

module.exports = { fetchValidator, saveValidator };
