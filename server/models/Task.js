const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});

taskSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);