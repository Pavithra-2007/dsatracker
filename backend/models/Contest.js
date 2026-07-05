const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contest name is required'],
      trim: true,
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank', 'Other'],
      required: [true, 'Platform is required'],
    },
    rank: {
      type: Number,
      default: null,
    },
    solved: {
      type: Number,
      default: 0,
    },
    totalProblems: {
      type: Number,
      default: 0,
    },
    ratingChange: {
      type: Number,
      default: 0,
    },
    ratingAfter: {
      type: Number,
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Contest date is required'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

contestSchema.index({ user: 1, date: -1 });

module.exports = mongoose.models.Contest || mongoose.model('Contest', contestSchema);