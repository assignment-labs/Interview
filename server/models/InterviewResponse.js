// models/InterviewResponse.js
const mongoose = require('mongoose');

const InterviewResponseSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  feedback: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  overallScore: {
    type: Number,
    min: 1,
    max: 10
  },
  strengths: [String],
  improvements: [String],
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InterviewResponse', InterviewResponseSchema);