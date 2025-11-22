const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('teams', teamSchema);