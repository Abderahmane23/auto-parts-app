/**
 * Environment-safe configuration
 * Works for:
 * - localhost development
 * - Beam Cloud production
 * - React (Vite / CRA / Next)
 */

export const AppConfig = (() => {
  const isLocalhost =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

  const ORIGIN = location.origin;

  return {
    ENV: isLocalhost ? 'development' : 'production',

    // ===== API =====
    API_BASE_URL: `${ORIGIN}/api`,

    // ===== IMAGES =====
    // Pour Cloudflare R2, décommentez et configurez :
    // IMAGES_BASE_URL: 'https://images.votre-domaine.com',
    IMAGES_BASE_URL: `${ORIGIN}/images/products`,

    // ===== PAGINATION =====
    PRODUCTS_PER_PAGE: 10,
    LOAD_MORE_COUNT: 10,

    // ===== HELPERS =====
    api(path) {
      return `${this.API_BASE_URL}${path}`;
    },

    /**
     * Construire l'URL d'une image de manière intelligente
     * @param {string} filename - Nom du fichier ou URL complète
     * @returns {string} URL correcte selon l'environnement
     */
    image(filename) {
      if (!filename) {
        return 'https://via.placeholder.com/300?text=No+Image';
      }

      // Si c'est déjà une URL complète, la retourner
      if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
      }

      // Construire l'URL avec le nom de fichier
      // Ne pas dupliquer /products/ si déjà présent dans filename
      if (filename.includes('products/')) {
        return `${ORIGIN}/images/${filename}`;
      }

      // Sinon, construire avec IMAGES_BASE_URL
      return `${this.IMAGES_BASE_URL}/${filename}`;
    },

    /**
     * Format price
     * @param {number} price
     * @returns {string}
     */
    formatPrice(price) {
      return new Intl.NumberFormat('fr-FR').format(price || 0);
    }
  };
})();