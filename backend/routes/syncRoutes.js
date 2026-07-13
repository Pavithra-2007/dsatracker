const express = require('express');
const router = express.Router();

const { syncLeetCode } = require('../controllers/syncController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/leetcode', syncLeetCode);

module.exports = router;