const mongoose = require('mongoose');
const { TOPICS, COMPANIES, PLATFORMS, DIFFICULTY, STATUS } = require('../config/constants');

const problemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
  type: String,
  default: '',
  trim: true,
},
problemId: {
  type: String,
  default: '',
  trim: true,
},
    platform: {
      type: String,
      enum: PLATFORMS,
      default: 'LeetCode',
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY,
      required: [true, 'Difficulty is required'],
    },
    topic: {
      type: String,
      enum: TOPICS,
      required: [true, 'Topic is required'],
    },
    subtopic: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: STATUS,
      default: 'Not Started',
    },
    dateSolved: {
      type: Date,
      default: null,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    codeLink: {
      type: String,
      default: '',
    },
    problemLink: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    companies: {
      type: [String],
      enum: COMPANIES,
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    revisionCount: {
      type: Number,
      default: 0,
    },
    lastRevised: {
      type: Date,
      default: null,
    },
    nextRevisionDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

problemSchema.index({ user: 1, status: 1 });
problemSchema.index({ user: 1, topic: 1 });
problemSchema.index({ user: 1, difficulty: 1 });
problemSchema.index({ user: 1, companies: 1 });
problemSchema.index({ user: 1, nextRevisionDate: 1 });
problemSchema.index({ user: 1, isFavorite: 1 });
problemSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Problem || mongoose.model('Problem', problemSchema);