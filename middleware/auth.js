// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Générer un token JWT
 * @param {Object} payload - Données à encoder
 * @returns {String} - Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
}

/**
 * Vérifier un token JWT
 * @param {String} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
}

/**
 * Middleware Fastify pour protéger les routes
 */
async function authenticateToken(request, reply) {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return reply.code(401).send({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier le token
    const decoded = verifyToken(token);

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId);
    if (!user) {
      return reply.code(401).send({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Attacher l'utilisateur à la requête
    request.user = {
      userId: user._id,
      name: user.name,
      authentification: user.authentification
    };

  } catch (error) {
    return reply.code(401).send({
      success: false,
      message: error.message || 'Authentification échouée'
    });
  }
}

/**
 * Middleware optionnel pour vérifier si authentifié
 */
async function optionalAuth(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        request.user = {
          userId: user._id,
          name: user.name,
          authentification: user.authentification
        };
      }
    }
  } catch (error) {
    // Ne pas bloquer si le token est invalide
    request.user = null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth
};