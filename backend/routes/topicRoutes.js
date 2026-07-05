const express = require('express');
const router = express.Router();

const { getTopics } = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTopics);

module.exports = router;