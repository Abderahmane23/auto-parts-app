// routes/pieceRoutes.js - FASTIFY CLEANED VERSION
const Piece = require('../models/Piece');

async function pieceRoutes(fastify, options) {

  // ======================
  // HELPER FUNCTION TO ADD IMAGE URL
  // ======================
  const addImageUrl = (piece) => {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.BEAM_DEPLOYMENT_URL;
    const baseUrl = isDev ? 'http://localhost:5000' : process.env.BEAM_DEPLOYMENT_URL;

    return {
      ...piece,
      image_url: piece.image_filename ? `${baseUrl}/images/products/${piece.image_filename}` : null
    };
  };

  // ======================
  // GET ALL PIECES
  // ======================
  fastify.get('/', async (request, reply) => {
    try {
      const pieces = await Piece.find()
        .populate('categorieId', 'nom')
        .sort({ createdAt: -1 });

      const piecesWithImages = pieces.map(p => addImageUrl(p.toObject()));

      return { success: true, count: piecesWithImages.length, data: piecesWithImages };
    } catch (error) {
      fastify.log.error('Error fetching pieces:', error);
      reply.code(500).send({ success: false, message: 'Erreur lors de la récupération des pièces', error: error.message });
    }
  });

  // ======================
  // GET SINGLE PIECE BY ID
  // ======================
  fastify.get('/:id', async (request, reply) => {
    try {
      const piece = await Piece.findById(request.params.id).populate('categorieId', 'nom');
      if (!piece) return reply.code(404).send({ success: false, message: 'Pièce non trouvée' });
      return { success: true, data: addImageUrl(piece.toObject()) };
    } catch (error) {
      fastify.log.error('Error fetching piece:', error);
      reply.code(500).send({ success: false, message: 'Erreur lors de la récupération de la pièce', error: error.message });
    }
  });

  // ======================
  // GET PIECES BY CATEGORY
  // ======================
  fastify.get('/category/:categoryId', async (request, reply) => {
    try {
      const pieces = await Piece.find({ categorieId: request.params.categoryId })
        .populate('categorieId', 'nom')
        .sort({ createdAt: -1 });

      const piecesWithImages = pieces.map(p => addImageUrl(p.toObject()));
      return { success: true, count: piecesWithImages.length, data: piecesWithImages };
    } catch (error) {
      fastify.log.error('Error fetching pieces by category:', error);
      reply.code(500).send({ success: false, message: 'Erreur lors de la récupération des pièces', error: error.message });
    }
  });

  // ======================
  // SEARCH PIECES
  // ======================
  fastify.get('/search/:query', async (request, reply) => {
    try {
      const q = request.params.query;
      const pieces = await Piece.find({
        $or: [
          { product_name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
        .populate('categorieId', 'nom')
        .sort({ createdAt: -1 });

      const piecesWithImages = pieces.map(p => addImageUrl(p.toObject()));
      return { success: true, count: piecesWithImages.length, data: piecesWithImages };
    } catch (error) {
      fastify.log.error('Error searching pieces:', error);
      reply.code(500).send({ success: false, message: 'Erreur lors de la recherche', error: error.message });
    }
  });

  // ======================
  // HELPER: RAG FUNCTION TO FIND MATCHING PRODUCTS
  // ======================
  async function findMatchingProducts(partName, description, keywords) {
    if (!partName || partName === 'Non identifié') return [];

    // --- Exact name match ---
    let exactMatches = await Piece.find({ product_name: { $regex: partName, $options: 'i' } })
      .populate('categorieId', 'nom')
      .limit(3);

    // --- Keywords match ---
    let keywordMatches = [];
    if (keywords?.length) {
      const regex = keywords.map(k => new RegExp(k, 'i'));
      keywordMatches = await Piece.find({
        $or: [
          { product_name: { $in: regex } },
          { description: { $in: regex } }
        ]
      }).populate('categorieId', 'nom').limit(5);
    }

    // --- Description match ---
    const descWords = description?.split(' ').filter(w => w.length > 3) || [];
    let descMatches = [];
    if (descWords.length) {
      const regex = descWords.slice(0, 5).map(w => new RegExp(w, 'i'));
      descMatches = await Piece.find({
        $or: [
          { product_name: { $in: regex } },
          { description: { $in: regex } }
        ]
      }).populate('categorieId', 'nom').limit(3);
    }

    // Combine and deduplicate
    const allMatches = [...exactMatches, ...keywordMatches, ...descMatches];
    const uniqueMatches = Array.from(new Map(allMatches.map(item => [item._id.toString(), item])).values());

    // Compute similarity score
    const scored = uniqueMatches.map(product => {
      let sim = 0;
      const productNameLower = product.product_name.toLowerCase();
      const partNameLower = partName.toLowerCase();

      if (productNameLower.includes(partNameLower)) sim += 0.5;
      else if (partNameLower.includes(productNameLower)) sim += 0.4;

      if (keywords?.length) {
        const matchedKeywords = keywords.filter(kw =>
          productNameLower.includes(kw.toLowerCase()) ||
          (product.description?.toLowerCase().includes(kw.toLowerCase()))
        );
        sim += (matchedKeywords.length / keywords.length) * 0.3;
      }

      if (descWords.length && product.description) {
        const commonWords = descWords.filter(word => product.description.toLowerCase().includes(word.toLowerCase()));
        sim += (commonWords.length / descWords.length) * 0.2;
      }

      sim = Math.min(sim, 1.0);

      return {
        ...product.toObject(),
        similarity: sim,
        image_url: product.image_filename
          ? `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : process.env.BEAM_DEPLOYMENT_URL}/images/products/${product.image_filename}`
          : null
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.filter(p => p.similarity > 0.3).slice(0, 10);
  }

  // ======================
  // EXPORT HELPER TO REUSE
  // ======================
  // fastify.decorate('findMatchingProducts', findMatchingProducts);
}

module.exports = pieceRoutes;
