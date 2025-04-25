// models/Interview.js
const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: [true, 'Please specify a role for this interview']
  },
  experience: {
    type: String,
    required: [true, 'Please specify experience level']
  },
  techStack: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    required: true
  },
  questions: [
    {
      id: {
        type: String,
        required: true
      },
      question: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['introduction', 'technical', 'behavioral', 'problem-solving', 'scenario', 'goals', 'career', 'closing'],
        required: true
      },
      sampleAnswer: {
        type: String
      }
    }
  ],
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);