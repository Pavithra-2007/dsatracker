const express = require('express');
const router = express.Router();

const { previewProblem, saveFetchedProblem } = require('../controllers/fetchController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { fetchValidator, saveValidator } = require('../validators/fetchValidator');

router.use(protect);

// Preview problem details without saving
router.post('/preview', fetchValidator, validate, previewProblem);

// Save problem after user confirms
router.post('/save', saveValidator, validate, saveFetchedProblem);

module.exports = router;