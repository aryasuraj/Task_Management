const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
   task_id:{
    type:String
   },
  title: {
    type: String
  },
  description: {
    type: String
  },
  dueDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdByRole:{
    type: String,
    enum: ['admin','user',"manager"],
    default:'user',
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  
  assignedTo:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: null
  }
}, {
  timestamps: true
});


taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('tasks', taskSchema);