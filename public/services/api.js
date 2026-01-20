// services/api.js
import { AppConfig } from '../config.js';

/**
 * Fetch all products
 */
export async function fetchProducts() {
  const response = await fetch(AppConfig.api('/pieces'));

  if (!response.ok) {
    throw new Error('Erreur de chargement des produits');
  }

  const json = await response.json();
  return json.data || json;
}

/**
 * Extract unique categories from products
 */
export function extractCategories(products) {
  return [
    ...new Set(
      products
        .map(p => p.categorieId?.nom || p.categorie)
        .filter(Boolean)
    )
  ];
}

/**
 * Filter products by category
 */
export function filterByCategory(products, category) {
  if (category === 'all') return products;

  return products.filter(
    p => (p.categorieId?.nom || p.categorie) === category
  );
}

/**
 * Search products by name / description
 */
export function searchProducts(products, search) {
  const q = search.toLowerCase();

  return products.filter(p =>
    p.product_name.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q))
  );
}
