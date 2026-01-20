
const Piece = require('../models/Piece');

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

module.exports = { findMatchingProducts };
