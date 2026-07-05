const express = require('express');
const router = express.Router();

const {
  getAnalytics,
  getHeatmap,
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAnalytics);
router.get('/heatmap', getHeatmap);

module.exports = router;