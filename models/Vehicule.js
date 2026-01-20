// models/Vehicule.js

const mongoose = require('mongoose');

const vehiculeSchema = new mongoose.Schema({
  modele: {
    type: String,
    required: true
  },
  annee: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Vehicule', vehiculeSchema);