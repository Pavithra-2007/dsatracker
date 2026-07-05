const mongoose = require('mongoose');
const { TOPICS } = require('../config/constants');

const topicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      enum: TOPICS,
      required: [true, 'Topic name is required'],
    },
    // Optional user notes per topic
    notes: {
      type: String,
      default: '',
    },
    // User can pin a topic to top
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

topicSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.Topic || mongoose.model('Topic', topicSchema);