const Commande = require('../models/Commande');
const Piece = require('../models/Piece');

async function commandeRoutes(fastify, options) {
  
  // POST - Créer une commande
  fastify.post('/', async (request, reply) => {
    try {
      const { userId, pieces, adresse } = request.body;

      if (!userId || !pieces || pieces.length === 0) {
        return reply.code(400).send({
          success: false,
          message: 'UserId et pièces sont requis'
        });
      }

      let totalCommande = 0;
      const piecesDetails = [];

      for (const item of pieces) {
        const piece = await Piece.findById(item.pieceId);

        if (!piece) {
          return reply.code(404).send({
            success: false,
            message: `Pièce ${item.pieceId} non trouvée`
          });
        }

        if (piece.quantite < item.quantite) {
          return reply.code(400).send({
            success: false,
            message: `Quantité insuffisante pour ${piece.nom}. Disponible: ${piece.quantite}`
          });
        }

        const totalItem = piece.prixUnitaire * item.quantite;
        totalCommande += totalItem;

        piecesDetails.push({
          pieceId: piece._id,
          nom: piece.nom,
          quantite: item.quantite,
          prixUnitaire: piece.prixUnitaire,
          total: totalItem
        });

        piece.quantite -= item.quantite;
        await piece.save();
      }

      const commande = new Commande({
        userId,
        pieces: piecesDetails,
        totalCommande,
        adresse,
        statut: 'en_cours'
      });

      await commande.save();
      await commande.populate('userId', 'name');

      return reply.code(201).send({
        success: true,
        message: 'Commande créée avec succès',
        data: commande
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création de la commande',
        error: error.message
      });
    }
  });

  // GET - Obtenir toutes les commandes
  fastify.get('/', async (request, reply) => {
    try {
      const { userId, statut } = request.query;
      
      const filter = {};
      if (userId) filter.userId = userId;
      if (statut) filter.statut = statut;

      const commandes = await Commande.find(filter)
        .populate('userId', 'name')
        .sort({ createdAt: -1 });

      return {
        success: true,
        count: commandes.length,
        data: commandes
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      });
    }
  });

  // GET - Obtenir une commande par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const commande = await Commande.findById(request.params.id)
        .populate('userId', 'name')
        .populate('pieces.pieceId');

      if (!commande) {
        return reply.code(404).send({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      return {
        success: true,
        data: commande
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message
      });
    }
  });

  // GET - Commandes d'un utilisateur
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const commandes = await Commande.find({ userId: request.params.userId })
        .sort({ createdAt: -1 });

      return {
        success: true,
        count: commandes.length,
        data: commandes
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      });
    }
  });

  // PATCH - Mettre à jour le statut
  fastify.patch('/:id/status', async (request, reply) => {
    try {
      const { statut } = request.body;

      if (!['en_cours', 'livree'].includes(statut)) {
        return reply.code(400).send({
          success: false,
          message: 'Statut invalide. Valeurs acceptées: en_cours, livree'
        });
      }

      const commande = await Commande.findById(request.params.id);

      if (!commande) {
        return reply.code(404).send({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      commande.statut = statut;
      await commande.save();

      return {
        success: true,
        message: 'Statut de la commande mis à jour',
        data: commande
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour une commande
  fastify.put('/:id', async (request, reply) => {
    try {
      const { adresse, statut } = request.body;

      const commande = await Commande.findById(request.params.id);

      if (!commande) {
        return reply.code(404).send({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      if (adresse) commande.adresse = adresse;
      if (statut) commande.statut = statut;

      await commande.save();

      return {
        success: true,
        message: 'Commande mise à jour avec succès',
        data: commande
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour de la commande',
        error: error.message
      });
    }
  });

  // DELETE - Annuler une commande
  fastify.delete('/:id', async (request, reply) => {
    try {
      const commande = await Commande.findById(request.params.id);

      if (!commande) {
        return reply.code(404).send({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Remettre les quantités en stock
      for (const item of commande.pieces) {
        const piece = await Piece.findById(item.pieceId);
        if (piece) {
          piece.quantite += item.quantite;
          await piece.save();
        }
      }

      await commande.deleteOne();

      return {
        success: true,
        message: 'Commande annulée et stock restauré'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de l\'annulation de la commande',
        error: error.message
      });
    }
  });
}

module.exports = commandeRoutes;