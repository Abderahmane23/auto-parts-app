// server.js - Fastify backend full corrected
require('dotenv').config();

const path = require('path');
const fastify = require('fastify');
const connectDB = require('./config/database');

// ======================
// Create Fastify instance
// ======================
const app = fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'error'
  }
});

// ======================
// Connect to MongoDB
// ======================
connectDB();

// ======================
// Plugin registration
// ======================
async function registerPlugins() {
  try {
    // CORS - MUST be first
    await app.register(require('@fastify/cors'), {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    });

    // Security headers
    await app.register(require('@fastify/helmet'), {
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false
    });

    // Compression
    await app.register(require('@fastify/compress'));

    // JWT auth
    await app.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET
    });

    // Rate limiting
    await app.register(
      require('@fastify/rate-limit'),
      require('./middleware/rateLimiter').rateLimitConfig.global
    );

    // Serve static files
    await app.register(require('@fastify/static'), {
      root: path.join(__dirname, 'public'),
      prefix: '/',
      maxAge: '1d',
      immutable: true,
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      }
    });

    // Auth decorator
    app.decorate('authenticate', async (request, reply) => {
      const { authenticateToken } = require('./middleware/auth');
      await authenticateToken(request, reply);
    });

    // Fastify auth plugin
    await app.register(require('@fastify/auth'));

    app.log.info('✅ All plugins registered successfully');
  } catch (err) {
    console.error('❌ Error registering plugins:', err);
    process.exit(1);
  }
}

// ======================
// Main server start
// ======================
(async () => {
  try {
    // 1️⃣ Register plugins first
    await registerPlugins();

    // 2️⃣ Health check route
    app.get('/api/health', async () => ({
      message: '🚗 API Auto Parts - Backend opérationnel (Fastify)',
      version: '2.0.0',
      status: 'running',
      framework: 'Fastify'
    }));

    // 3️⃣ Register all API routes
    app.register(require('./routes/authRoutes'), { prefix: '/api/auth' });
    app.register(require('./routes/userRoutes'), { prefix: '/api/users' });
    app.register(require('./routes/pieceRoutes'), { prefix: '/api/pieces' });
    app.register(require('./routes/categorieRoutes'), { prefix: '/api/categories' });
    app.register(require('./routes/vehiculeRoutes'), { prefix: '/api/vehicules' });
    app.register(require('./routes/commandeRoutes'), { prefix: '/api/commandes' });
    app.register(require('./routes/factureRoutes'), { prefix: '/api/factures' });
    app.register(require('./routes/messageRoutes'), { prefix: '/api/messages' });
    app.register(require('./routes/imageRoutes'), { prefix: '/api/image' });

    // Temporary debug route to check imageRoutes
    app.get('/api/image/test', async () => ({
      success: true,
      message: '🟢 Image route is working!'
    }));

    // 4️⃣ Not found handler
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url.startsWith('/api')) {
        reply.code(404).send({
          success: false,
          message: 'Route API non trouvée'
        });
      } else {
        // SPA fallback
        reply.sendFile('index.html');
      }
    });

    // 5️⃣ Global error handler
    app.setErrorHandler((error, request, reply) => {
      app.log.error(error);
      reply.code(error.statusCode || 500).send({
        success: false,
        message: error.message || 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    });

    // 6️⃣ Start listening
    const PORT = process.env.PORT || 5000;
    await app.listen({ port: PORT, host: '0.0.0.0' });

    console.log(`🚀 Serveur Fastify démarré sur le port ${PORT}`);
    console.log(`📝 Mode: ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error('❌ Fatal error starting server:', err);
    process.exit(1);
  }
})();

// ======================
// Graceful shutdown
// ======================
const closeGracefully = async (signal) => {
  console.log(`\n👋 ${signal} reçu. Arrêt du serveur...`);
  
  // Force close after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('🛑 Arrêt forcé après délai dépassé');
    process.exit(1);
  }, 5000).unref();

  try {
    await app.close();
    console.log('✅ Serveur Fastify arrêté');
    
    await mongoose.connection.close(false);
    console.log('✅ MongoDB déconnecté');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de l\'arrêt:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', closeGracefully);
process.on('SIGINT', closeGracefully);
