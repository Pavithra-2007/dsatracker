const express = require('express');
const { param } = require('express-validator');
const router = express.Router();

const {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
} = require('../controllers/problemController');

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { problemValidator, problemUpdateValidator } = require('../validators/problemValidator');

const problemIdValidator = [param('id').isMongoId().withMessage('Invalid problem ID')];

router.use(protect); // all problem routes are protected

router.route('/')
  .get(getProblems)
  .post(problemValidator, validate, createProblem);

router.route('/:id')
  .get(problemIdValidator, validate, getProblemById)
  .put(problemIdValidator, problemUpdateValidator, validate, updateProblem)
  .delete(problemIdValidator, validate, deleteProblem);

module.exports = router;
