const express = require('express');
const router  = express.Router();

const {
  getRevisions,
  getAllRevisions,
  markRevised,
  skipRevision,
} = require('../controllers/revisionController');

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',     getRevisions);
router.get('/all',  getAllRevisions);
router.put('/:id/mark', markRevised);
router.put('/:id/skip', skipRevision);

module.exports = router;