
// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['user', 'operator'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ userId: 1 });
messageSchema.index({ date: -1 });

module.exports = mongoose.model('Message', messageSchema);