// routes/authRoutes.js
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimiter');

async function authRoutes(fastify, options) {
  
  /**
   * @route   POST /api/auth/register
   * @desc    Créer un nouveau compte
   * @access  Public
   */
  fastify.post('/register', {
    config: {
      rateLimit: createRateLimiter('auth')
    }
  }, async (request, reply) => {
    try {
      const { name, email, password } = request.body;

      // Validation
      if (!name || !email || !password) {
        return reply.code(400).send({
          success: false,
          message: 'Nom, email et mot de passe sont requis'
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ name: email });
      if (existingUser) {
        return reply.code(400).send({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      // Créer l'utilisateur (vous devrez ajouter le hashage du mot de passe)
      const user = new User({
        name: email,
        authentification: true,
        modules: ['marketplace'],
        // TODO: Hasher le mot de passe avec bcrypt
        // password: await bcrypt.hash(password, 10)
      });

      await user.save();

      // Générer le token JWT
      const token = generateToken({
        userId: user._id,
        name: user.name
      });

      return reply.code(201).send({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: {
            id: user._id,
            name: user.name
          },
          token
        }
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la création du compte',
        error: error.message
      });
    }
  });

  /**
   * @route   POST /api/auth/login
   * @desc    Se connecter
   * @access  Public
   */
  fastify.post('/login', {
    config: {
      rateLimit: createRateLimiter('auth')
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({
          success: false,
          message: 'Email et mot de passe sont requis'
        });
      }

      // Trouver l'utilisateur
      const user = await User.findOne({ name: email });
      if (!user) {
        return reply.code(401).send({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // TODO: Vérifier le mot de passe
      // const isValidPassword = await bcrypt.compare(password, user.password);
      // if (!isValidPassword) {
      //   return reply.code(401).send({
      //     success: false,
      //     message: 'Email ou mot de passe incorrect'
      //   });
      // }

      // Générer le token
      const token = generateToken({
        userId: user._id,
        name: user.name
      });

      return {
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user._id,
            name: user.name
          },
          token
        }
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la connexion',
        error: error.message
      });
    }
  });

  /**
   * @route   GET /api/auth/me
   * @desc    Obtenir le profil de l'utilisateur connecté
   * @access  Private
   */
  fastify.get('/me', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const user = await User.findById(request.user.userId);
      
      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      return {
        success: true,
        data: {
          id: user._id,
          name: user.name,
          modules: user.modules,
          nbUtilisation: user.nbUtilisation
        }
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: error.message
      });
    }
  });

  /**
   * @route   POST /api/auth/refresh
   * @desc    Rafraîchir le token
   * @access  Private
   */
  fastify.post('/refresh', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const newToken = generateToken({
        userId: request.user.userId,
        name: request.user.name
      });

      return {
        success: true,
        data: { token: newToken }
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors du rafraîchissement du token',
        error: error.message
      });
    }
  });
}

module.exports = authRoutes;