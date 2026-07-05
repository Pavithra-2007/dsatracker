const express = require('express');
const router = express.Router();

const { getGoals, setGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getGoals);
router.post('/', setGoal);

module.exports = router;