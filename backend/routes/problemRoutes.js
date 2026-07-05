const express = require('express');
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
const { problemValidator } = require('../validators/problemValidator');

router.use(protect); // all problem routes are protected

router.route('/')
  .get(getProblems)
  .post(problemValidator, validate, createProblem);

router.route('/:id')
  .get(getProblemById)
  .put(updateProblem)
  .delete(deleteProblem);

module.exports = router;