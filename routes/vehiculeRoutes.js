const Vehicule = require('../models/Vehicule');

async function vehiculeRoutes(fastify, options) {
  
  // GET - Obtenir tous les véhicules
  fastify.get('/', async (request, reply) => {
    try {
      const { annee, modele } = request.query;
      
      const filter = {};
      if (annee) filter.annee = parseInt(annee);
      if (modele) filter.modele = { $regex: modele, $options: 'i' };

      const vehicules = await Vehicule.find(filter).sort({ annee: -1, modele: 1 });

      return {
        success: true,
        count: vehicules.length,
        data: vehicules
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des véhicules',
        error: error.message
      });
    }
  });

  // GET - Obtenir un véhicule par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const vehicule = await Vehicule.findById(request.params.id);

      if (!vehicule) {
        return reply.code(404).send({
          success: false,
          message: 'Véhicule non trouvé'
        });
      }

      return {
        success: true,
        data: vehicule
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération du véhicule',
        error: error.message
      });
    }
  });

  // POST - Créer un véhicule
  fastify.post('/', async (request, reply) => {
    try {
      const { modele, annee } = request.body;

      if (!modele || !annee) {
        return reply.code(400).send({
          success: false,
          message: 'Modèle et année sont requis'
        });
      }

      const vehicule = new Vehicule({
        modele,
        annee
      });

      await vehicule.save();

      return reply.code(201).send({
        success: true,
        message: 'Véhicule créé avec succès',
        data: vehicule
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création du véhicule',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour un véhicule
  fastify.put('/:id', async (request, reply) => {
    try {
      const { modele, annee } = request.body;

      const vehicule = await Vehicule.findById(request.params.id);

      if (!vehicule) {
        return reply.code(404).send({
          success: false,
          message: 'Véhicule non trouvé'
        });
      }

      if (modele) vehicule.modele = modele;
      if (annee) vehicule.annee = annee;

      await vehicule.save();

      return {
        success: true,
        message: 'Véhicule mis à jour avec succès',
        data: vehicule
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour du véhicule',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer un véhicule
  fastify.delete('/:id', async (request, reply) => {
    try {
      const vehicule = await Vehicule.findById(request.params.id);

      if (!vehicule) {
        return reply.code(404).send({
          success: false,
          message: 'Véhicule non trouvé'
        });
      }

      await vehicule.deleteOne();

      return {
        success: true,
        message: 'Véhicule supprimé avec succès'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression du véhicule',
        error: error.message
      });
    }
  });
}

module.exports = vehiculeRoutes;