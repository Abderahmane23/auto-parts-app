// routes/imageRoutes.js
const Anthropic = require('@anthropic-ai/sdk');

async function imageRoutes(fastify, options) {
  // ======================
  // POST /api/image/analyze
  // ======================
  fastify.post('/analyze', async (request, reply) => {
    try {
      const { image } = request.body;

      if (!image) {
        return reply.code(400).send({
          success: false,
          message: 'Image requise'
        });
      }

      // Validate image size (max 10MB)
      const imageSizeInBytes = Buffer.from(image, 'base64').length;
      const maxSize = 10 * 1024 * 1024;
      if (imageSizeInBytes > maxSize) {
        return reply.code(400).send({
          success: false,
          message: 'Image trop volumineuse (max 10MB)'
        });
      }

      fastify.log.info('Analyzing image with Claude Vision...');

      // ======================
      // 1️⃣ Analyze image with Claude
      // ======================
      const analysisResult = await analyzeImageWithClaude(image);

      fastify.log.info('Image analysis complete:', {
        partName: analysisResult.partName,
        confidence: analysisResult.confidence
      });

      // ======================
      // 2️⃣ Find matching products using RAG helper
      // ======================
      try {
        const matchedProducts = await findMatchingProducts(
          analysisResult.partName,
          analysisResult.description,
          analysisResult.keywords
        );

        fastify.log.info(`Found ${matchedProducts.length} matching products`);

        return {
          success: true,
          analysis: analysisResult,
          matchedProducts
        };
      } catch (matchError) {
         fastify.log.error('Error finding matching products:', matchError);
         // Return analysis even if matching fails
         return {
            success: true,
            analysis: analysisResult,
            matchedProducts: [],
            warning: "Erreur lors de la recherche de produits correspondants"
         };
      }
    } catch (error) {
      fastify.log.error('Error processing image request:', error);
      reply.code(500).send({
        success: false,
        message: error.message || "Erreur lors de l'analyse de l'image",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // ======================
  // Helper function: Analyze image with Claude
  // ======================
  async function analyzeImageWithClaude(base64Image) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY non configurée');
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
              },
              {
                type: 'text',
                text: `
Vous êtes un expert en pièces automobiles. Analysez cette image et retournez UNIQUEMENT au format JSON :

{
  "partName": "nom précis de la pièce en français",
  "description": "description détaillée de la pièce avec caractéristiques visibles",
  "confidence": 0.95,
  "keywords": ["mot-clé1", "mot-clé2"],
  "category": "catégorie de la pièce",
  "possibleBrands": ["marque1", "marque2"]
}

Si ce n'est pas une pièce automobile, retournez:
{
  "partName": "Non identifié",
  "description": "Cette image ne semble pas contenir une pièce automobile",
  "confidence": 0.0,
  "keywords": [],
  "category": "unknown",
  "possibleBrands": []
}`
              }
            ]
          }
        ]
      });

      // Parse JSON response from Claude
      const responseText = message.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse invalide de Claude');

      const analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.partName || !analysis.description || analysis.confidence === undefined) {
        throw new Error("Données d'analyse incomplètes");
      }

      return analysis;
    } catch (err) {
      fastify.log.error({ err }, 'Claude API error details');
      if (err.response) {
         fastify.log.error({ 
           status: err.status, 
           headers: err.headers, 
           error: err.error 
         }, 'Claude API Response Error');
      }
      throw err;
    }
  }
}

module.exports = imageRoutes;
