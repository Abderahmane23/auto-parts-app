const Message = require('../models/Message');

async function messageRoutes(fastify, options) {
  
  // POST - Créer un message
  fastify.post('/', async (request, reply) => {
    try {
      const { senderType, userId, operatorId, message } = request.body;

      if (!senderType || !message) {
        return reply.code(400).send({
          success: false,
          message: 'Type d\'expéditeur et message sont requis'
        });
      }

      if (!['user', 'operator'].includes(senderType)) {
        return reply.code(400).send({
          success: false,
          message: 'Type d\'expéditeur invalide. Valeurs acceptées: user, operator'
        });
      }

      if (senderType === 'user' && !userId) {
        return reply.code(400).send({
          success: false,
          message: 'userId requis pour un message utilisateur'
        });
      }

      if (senderType === 'operator' && !operatorId) {
        return reply.code(400).send({
          success: false,
          message: 'operatorId requis pour un message opérateur'
        });
      }

      const newMessage = new Message({
        senderType,
        userId: senderType === 'user' ? userId : undefined,
        operatorId: senderType === 'operator' ? operatorId : undefined,
        message
      });

      await newMessage.save();

      return reply.code(201).send({
        success: true,
        message: 'Message envoyé avec succès',
        data: newMessage
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de l\'envoi du message',
        error: error.message
      });
    }
  });

  // GET - Obtenir tous les messages
  fastify.get('/', async (request, reply) => {
    try {
      const { userId, senderType, limit = 50 } = request.query;
      
      const filter = {};
      if (userId) filter.userId = userId;
      if (senderType) filter.senderType = senderType;

      const messages = await Message.find(filter)
        .populate('userId', 'name')
        .populate('operatorId', 'name')
        .sort({ date: -1 })
        .limit(parseInt(limit));

      return {
        success: true,
        count: messages.length,
        data: messages
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des messages',
        error: error.message
      });
    }
  });

  // GET - Obtenir un message par ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const message = await Message.findById(request.params.id)
        .populate('userId', 'name')
        .populate('operatorId', 'name');

      if (!message) {
        return reply.code(404).send({
          success: false,
          message: 'Message non trouvé'
        });
      }

      return {
        success: true,
        data: message
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération du message',
        error: error.message
      });
    }
  });

  // GET - Messages d'un utilisateur
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const messages = await Message.find({ userId: request.params.userId })
        .populate('operatorId', 'name')
        .sort({ date: 1 });

      return {
        success: true,
        count: messages.length,
        data: messages
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération des messages',
        error: error.message
      });
    }
  });

  // GET - Conversation complète
  fastify.get('/conversation/:userId', async (request, reply) => {
    try {
      const messages = await Message.find({
        $or: [
          { userId: request.params.userId, senderType: 'user' },
          { userId: request.params.userId, senderType: 'operator' }
        ]
      })
        .populate('userId', 'name')
        .populate('operatorId', 'name')
        .sort({ date: 1 });

      return {
        success: true,
        count: messages.length,
        data: messages
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération de la conversation',
        error: error.message
      });
    }
  });

  // PUT - Mettre à jour un message
  fastify.put('/:id', async (request, reply) => {
    try {
      const { message } = request.body;

      const msg = await Message.findById(request.params.id);

      if (!msg) {
        return reply.code(404).send({
          success: false,
          message: 'Message non trouvé'
        });
      }

      if (message) msg.message = message;

      await msg.save();

      return {
        success: true,
        message: 'Message mis à jour avec succès',
        data: msg
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la mise à jour du message',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer un message
  fastify.delete('/:id', async (request, reply) => {
    try {
      const message = await Message.findById(request.params.id);

      if (!message) {
        return reply.code(404).send({
          success: false,
          message: 'Message non trouvé'
        });
      }

      await message.deleteOne();

      return {
        success: true,
        message: 'Message supprimé avec succès'
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression du message',
        error: error.message
      });
    }
  });

  // DELETE - Supprimer toute la conversation
  fastify.delete('/conversation/:userId', async (request, reply) => {
    try {
      const result = await Message.deleteMany({ userId: request.params.userId });

      return {
        success: true,
        message: `${result.deletedCount} message(s) supprimé(s)`
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la suppression de la conversation',
        error: error.message
      });
    }
  });
}

module.exports = messageRoutes;