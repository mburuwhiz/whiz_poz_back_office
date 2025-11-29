const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  salaryId: {
    type: String, // Maps to Desktop 'id' e.g. SAL123456
    required: true,
    unique: true
  },
  employeeName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['full', 'advance'],
    default: 'full'
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Salary', salarySchema);
