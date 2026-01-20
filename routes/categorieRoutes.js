const Categorie = require('../models/Categorie');

async function categorieRoutes(fastify, options) {
  
  // GET - Obtenir toutes les catégories
  fastify.get('/', async (request, reply) => {
    try {
      const categories = await Categorie.find().sort({ nom: 1 });

      return {
        success: true,
        count: categories.length,
        data: categories
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        error: error.message
      });
    }
  });

  // GET - Obtenir une catégorie par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const categorie = await Categorie.findById(request.params.id);

      if (!categorie) {
        return reply.code(404).send({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      return {
        success: true,
        data: categorie
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de la catégorie',
        error: error.message
      });
    }
  });

  // POST - Créer une catégorie
  fastify.post('/', async (request, reply) => {
    try {
      const { nom, description } = request.body;

      if (!nom) {
        return reply.code(400).send({
          success: false,
          message: 'Le nom de la catégorie est requis'
        });
      }

      const existingCategorie = await Categorie.findOne({ nom });
      if (existingCategorie) {
        return reply.code(400).send({
          success: false,
          message: 'Cette catégorie existe déjà'
        });
      }

      const categorie = new Categorie({
        nom,
        description
      });

      await categorie.save();

      return reply.code(201).send({
        success: true,
        message: 'Catégorie créée avec succès',
        data: categorie
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création de la catégorie',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour une catégorie
  fastify.put('/:id', async (request, reply) => {
    try {
      const { nom, description } = request.body;

      const categorie = await Categorie.findById(request.params.id);

      if (!categorie) {
        return reply.code(404).send({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      if (nom) categorie.nom = nom;
      if (description !== undefined) categorie.description = description;

      await categorie.save();

      return {
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: categorie
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour de la catégorie',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer une catégorie
  fastify.delete('/:id', async (request, reply) => {
    try {
      const categorie = await Categorie.findById(request.params.id);

      if (!categorie) {
        return reply.code(404).send({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      await categorie.deleteOne();

      return {
        success: true,
        message: 'Catégorie supprimée avec succès'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression de la catégorie',
        error: error.message
      });
    }
  });
}

module.exports = categorieRoutes;