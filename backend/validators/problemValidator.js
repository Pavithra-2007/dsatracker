const { body } = require('express-validator');
const { TOPICS, COMPANIES, PLATFORMS, DIFFICULTY, STATUS } = require('../config/constants');

const optionalText = (field, max, label = field) => body(field)
  .optional({ values: 'null' })
  .isString().withMessage(`${label} must be text`)
  .trim()
  .isLength({ max }).withMessage(`${label} cannot exceed ${max} characters`);

const problemFields = [
  body('title').optional().isString().withMessage('Problem title must be text').trim()
    .notEmpty().withMessage('Problem title is required').isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('difficulty').optional().isIn(DIFFICULTY).withMessage('Invalid difficulty'),
  body('topic').optional().isIn(TOPICS).withMessage('Invalid topic'),
  body('status').optional().isIn(STATUS.filter((status) => status !== 'Revised'))
    .withMessage('Status must be Not Started, Solved or Need Revision'),
  body('platform').optional().isIn(PLATFORMS).withMessage('Invalid platform'),
  body('subtopic').optional().isString().trim().isLength({ max: 100 }).withMessage('Subtopic cannot exceed 100 characters'),
  body('dateSolved').optional({ values: 'null' }).custom((value) => {
    if (value === null) return true;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date <= new Date();
  }).withMessage('Solve date must be a valid date no later than now'),
  body('timeTaken').optional().isFloat({ min: 0, max: 100000 }).withMessage('Time taken must be a non-negative number'),
  body('attempts').optional().isInt({ min: 1, max: 10000 }).withMessage('Attempts must be between 1 and 10000'),
  body('problemLink').optional().isString().trim().isLength({ max: 2048 })
    .custom((value) => !value || /^https?:\/\//i.test(value)).withMessage('Problem link must use http or https'),
  body('codeLink').optional().isString().trim().isLength({ max: 2048 })
    .custom((value) => !value || /^https?:\/\//i.test(value)).withMessage('Code link must use http or https'),
  optionalText('notes', 10000, 'Notes'),
  body('companies').optional().isArray({ max: COMPANIES.length }).withMessage('Companies must be a list')
    .custom((items) => items.every((item) => COMPANIES.includes(item))).withMessage('Invalid company'),
  body('tags').optional().isArray({ max: 50 }).withMessage('Tags must be a list')
    .custom((items) => items.every((item) => typeof item === 'string' && item.length <= 50)).withMessage('Tags must be text up to 50 characters'),
  body('isFavorite').optional().isBoolean().withMessage('Favorite must be true or false'),
  body('isBookmarked').optional().isBoolean().withMessage('Bookmark must be true or false'),
];

const problemValidator = [
  ...problemFields,
  body('title').exists().withMessage('Problem title is required'),
  body('difficulty').exists().withMessage('Difficulty is required'),
  body('topic').exists().withMessage('Topic is required'),
];

const problemUpdateValidator = [
  ...problemFields,
  body().custom((value) => Object.keys(value).some((key) => [
    'title', 'difficulty', 'topic', 'status', 'platform', 'subtopic', 'dateSolved', 'timeTaken',
    'attempts', 'problemLink', 'codeLink', 'notes', 'companies', 'tags', 'isFavorite', 'isBookmarked',
  ].includes(key))).withMessage('No updateable problem fields provided'),
];

module.exports = { problemValidator, problemUpdateValidator };
