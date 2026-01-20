const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
  type: String,
  required: true,
  select: false // Ne pas renvoyer par défaut
  },
  nbUtilisation: {
    type: Number,
    default: 0
  },
  modules: [{
    type: String
  }],
  authentification: {
    type: Boolean,
    required: true,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ name: 1 });

module.exports = mongoose.model('User', userSchema);