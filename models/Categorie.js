// models/Categorie.js
const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  }
});

module.exports = mongoose.model('Categorie', categorieSchema);