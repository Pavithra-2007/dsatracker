const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    target: {
      type: Number,
      required: [true, 'Goal target is required'],
      min: 1,
    },
    achieved: {
      type: Number,
      default: 0,
    },
    // Start of the period this goal covers
    period: {
      type: Date,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One goal per user per type per period
goalSchema.index({ user: 1, type: 1, period: 1 }, { unique: true });

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);