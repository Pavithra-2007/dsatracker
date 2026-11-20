const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Stored as midnight UTC — one doc per user per day
    date: {
      type: Date,
      required: true,
    },
    dayKey: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
    minutesStudied: {
      type: Number,
      default: 0,
    },
    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, date: -1 });
activitySchema.index({ user: 1, date: 1 }, { unique: true });
activitySchema.index({ user: 1, dayKey: 1 }, {
  unique: true,
  partialFilterExpression: { dayKey: { $type: 'string' } },
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
