const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String
  },
  resume: {
    type: String // This would store the URL to the uploaded resume file
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'rejected', 'shortlisted', 'accepted'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate applications
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);