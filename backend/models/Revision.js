const mongoose = require('mongoose');
const { REVISION_INTERVALS } = require('../config/constants');

const revisionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    // D+1, D+3, D+7, D+15, D+30, D+60
    scheduledDates: {
      type: [Date],
      default: [],
    },
    completedDates: {
      type: [Date],
      default: [],
    },
    // Index into scheduledDates — which step is next
    currentStep: {
      type: Number,
      default: 0,
      min: 0,
      max: REVISION_INTERVALS.length,
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

revisionSchema.index({ user: 1, problem: 1 }, { unique: true });
revisionSchema.index({ user: 1, isComplete: 1 });

module.exports = mongoose.models.Revision || mongoose.model('Revision', revisionSchema);