const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, required: true },
  
  // Education Info
  degree: {
    status: { type: String, enum: ['pursuing', 'completed'], required: true },
    name: { type: String, required: true }
  },
  schoolGroup: { type: String },
  
  // User Type
  userType: { type: String, enum: ['school', 'college', 'employee'], required: true },
  
  // Career/Field Info
  currentField: { type: String },
  hasCareerIdea: { type: Boolean },
  selectedCareerOption: { type: String },
  selectedCareerField: { type: String },
  
  // AI Analysis Results
  fieldAnalysis: {
    hasValue: { type: Boolean },
    value: { type: String },
    growth: { type: String },
    salary: { type: String },
    skills: [{ type: String }],
    alternatives: [{ type: String }]
  },
  
  // Psychometric Test Results
  psychometricResults: {
    completed: { type: Boolean, default: false },
    personality: { type: String },
    suggestedFields: [{
      field: { type: String },
      reason: { type: String },
      score: { type: Number }
    }],
    strengths: [{ type: String }],
    answers: { type: Object }
  },
  
  // Employee specific info
  employeeInfo: {
    currentField: { type: String },
    wantToSwitch: { type: Boolean },
    developCurrent: { type: Boolean },
    suggestions: [{
      field: { type: String },
      difficulty: { type: String },
      timeline: { type: String },
      skills: [{ type: String }]
    }]
  },
  
  // Additional details
  additionalDetails: { type: String },
  
  // Registration completion status
  registrationComplete: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);