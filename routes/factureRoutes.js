const Facture = require('../models/Facture');
const Commande = require('../models/Commande');

async function factureRoutes(fastify, options) {
  
  // POST - Créer une facture
  fastify.post('/', async (request, reply) => {
    try {
      const { commandeId, modePaiement } = request.body;

      if (!commandeId || !modePaiement) {
        return reply.code(400).send({
          success: false,
          message: 'CommandeId et mode de paiement sont requis'
        });
      }

      const commande = await Commande.findById(commandeId);
      if (!commande) {
        return reply.code(404).send({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      const factureExistante = await Facture.findOne({ commandeId });
      if (factureExistante) {
        return reply.code(400).send({
          success: false,
          message: 'Une facture existe déjà pour cette commande'
        });
      }

      const facture = new Facture({
        commandeId,
        modePaiement,
        statut: 'en_attente'
      });

      await facture.save();
      await facture.populate('commandeId');

      return reply.code(201).send({
        success: true,
        message: 'Facture créée avec succès',
        data: facture
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création de la facture',
        error: error.message
      });
    }
  });

  // GET - Obtenir toutes les factures
  fastify.get('/', async (request, reply) => {
    try {
      const { statut } = request.query;
      
      const filter = {};
      if (statut) filter.statut = statut;

      const factures = await Facture.find(filter)
        .populate({
          path: 'commandeId',
          populate: { path: 'userId', select: 'name' }
        })
        .sort({ date: -1 });

      return {
        success: true,
        count: factures.length,
        data: factures
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des factures',
        error: error.message
      });
    }
  });

  // GET - Obtenir une facture par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const facture = await Facture.findById(request.params.id)
        .populate({
          path: 'commandeId',
          populate: { path: 'userId', select: 'name' }
        });

      if (!facture) {
        return reply.code(404).send({
          success: false,
          message: 'Facture non trouvée'
        });
      }

      return {
        success: true,
        data: facture
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de la facture',
        error: error.message
      });
    }
  });

  // GET - Facture d'une commande
  fastify.get('/commande/:commandeId', async (request, reply) => {
    try {
      const facture = await Facture.findOne({ commandeId: request.params.commandeId })
        .populate('commandeId');

      if (!facture) {
        return reply.code(404).send({
          success: false,
          message: 'Aucune facture trouvée pour cette commande'
        });
      }

      return {
        success: true,
        data: facture
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de la facture',
        error: error.message
      });
    }
  });

  // PATCH - Mettre à jour le statut de paiement
  fastify.patch('/:id/status', async (request, reply) => {
    try {
      const { statut } = request.body;

      if (!['en_attente', 'payee', 'annulee'].includes(statut)) {
        return reply.code(400).send({
          success: false,
          message: 'Statut invalide. Valeurs acceptées: en_attente, payee, annulee'
        });
      }

      const facture = await Facture.findById(request.params.id);

      if (!facture) {
        return reply.code(404).send({
          success: false,
          message: 'Facture non trouvée'
        });
      }

      facture.statut = statut;
      await facture.save();

      // Si la facture est payée, mettre à jour la commande
      if (statut === 'payee') {
        await Commande.findByIdAndUpdate(facture.commandeId, {
          statut: 'livree'
        });
      }

      return {
        success: true,
        message: 'Statut de la facture mis à jour',
        data: facture
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour une facture
  fastify.put('/:id', async (request, reply) => {
    try {
      const { modePaiement, statut } = request.body;

      const facture = await Facture.findById(request.params.id);

      if (!facture) {
        return reply.code(404).send({
          success: false,
          message: 'Facture non trouvée'
        });
      }

      if (modePaiement) facture.modePaiement = modePaiement;
      if (statut) facture.statut = statut;

      await facture.save();

      return {
        success: true,
        message: 'Facture mise à jour avec succès',
        data: facture
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour de la facture',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer une facture
  fastify.delete('/:id', async (request, reply) => {
    try {
      const facture = await Facture.findById(request.params.id);

      if (!facture) {
        return reply.code(404).send({
          success: false,
          message: 'Facture non trouvée'
        });
      }

      await facture.deleteOne();

      return {
        success: true,
        message: 'Facture supprimée avec succès'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression de la facture',
        error: error.message
      });
    }
  });
}

module.exports = factureRoutes;