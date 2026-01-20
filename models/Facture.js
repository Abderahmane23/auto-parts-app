// models/Facture.js
const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  commandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    required: true
  },
  modePaiement: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    required: true,
    enum: ['en_attente', 'payee', 'annulee'],
    default: 'en_attente'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Facture', factureSchema);