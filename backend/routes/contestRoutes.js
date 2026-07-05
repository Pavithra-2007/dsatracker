const express = require('express');
const router = express.Router();

const {
  createContest,
  getContests,
  updateContest,
  deleteContest,
} = require('../controllers/contestController');

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getContests)
  .post(createContest);

router.route('/:id')
  .put(updateContest)
  .delete(deleteContest);

module.exports = router;