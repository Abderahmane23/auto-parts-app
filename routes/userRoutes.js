const User = require('../models/User');

async function userRoutes(fastify, options) {
  
  // POST - Créer un utilisateur
  fastify.post('/', async (request, reply) => {
    try {
      const { name, authentification, modules } = request.body;

      if (!name) {
        return reply.code(400).send({
          success: false,
          message: 'Le nom est requis'
        });
      }

      const user = new User({
        name,
        authentification: authentification || false,
        modules: modules || [],
        nbUtilisation: 0
      });

      await user.save();

      return reply.code(201).send({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: user
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur',
        error: error.message
      });
    }
  });

  // GET - Obtenir un utilisateur par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const user = await User.findById(request.params.id);

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de l\'utilisateur',
        error: error.message
      });
    }
  });

  // GET - Obtenir tous les utilisateurs
  fastify.get('/', async (request, reply) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      return {
        success: true,
        count: users.length,
        data: users
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour un utilisateur
  fastify.put('/:id', async (request, reply) => {
    try {
      const { name, authentification, modules, nbUtilisation } = request.body;

      const user = await User.findById(request.params.id);

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (name) user.name = name;
      if (typeof authentification !== 'undefined') user.authentification = authentification;
      if (modules) user.modules = modules;
      if (typeof nbUtilisation !== 'undefined') user.nbUtilisation = nbUtilisation;

      await user.save();

      return {
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: user
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'utilisateur',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer un utilisateur
  fastify.delete('/:id', async (request, reply) => {
    try {
      const user = await User.findById(request.params.id);

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      await user.deleteOne();

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression de l\'utilisateur',
        error: error.message
      });
    }
  });

  // POST - Mettre à jour les stats
  fastify.post('/:id/stats', async (request, reply) => {
    try {
      const user = await User.findById(request.params.id);

      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      user.nbUtilisation += 1;
      await user.save();

      return {
        success: true,
        message: 'Statistiques mises à jour',
        data: {
          userId: user._id,
          nbUtilisation: user.nbUtilisation
        }
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour des statistiques',
        error: error.message
      });
    }
  });
}

module.exports = userRoutes;