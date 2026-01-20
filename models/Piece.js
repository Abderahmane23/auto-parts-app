// models/Piece.js
const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  quantite: {
    type: Number,
    required: true,
    min: 0
  },
  etat: {
    type: String,
    enum: ['neuf', 'bon', 'rebutee'],
    default: 'bon'
  },
  images: [{
    type: String
  }],
  categorieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie'
  },
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

pieceSchema.index({ categorieId: 1 });
pieceSchema.index({ vehiculeId: 1 });

module.exports = mongoose.model('Piece', pieceSchema);