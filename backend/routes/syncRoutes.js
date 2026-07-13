const express = require('express');
const router  = express.Router();

const { syncLeetCode, syncContests } = require('../controllers/syncController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/leetcode',          syncLeetCode);
router.post('/leetcode/contests', syncContests);

module.exports = router;