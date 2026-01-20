// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppConfig } from '../config.js';
import { fetchProducts, extractCategories, filterByCategory, searchProducts } from '../services/api.js';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------
  // INITIALIZATION
  // --------------------
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const products = await fetchProducts();
        setAllProducts(products);
        setFilteredProducts(products);

        const cats = extractCategories(products);
        setCategories(cats);

        setDisplayedProducts(products.slice(0, AppConfig.PRODUCTS_PER_PAGE));
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
        setError('Impossible de charger les produits');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // --------------------
  // FILTERS
  // --------------------
  const applyFilters = (category = currentCategory, search = searchQuery) => {
    let results = filterByCategory(allProducts, category);
    results = searchProducts(results, search);
    setFilteredProducts(results);
    setDisplayedProducts(results.slice(0, AppConfig.PRODUCTS_PER_PAGE));
  };

  const handleCategoryClick = (cat) => {
    setCurrentCategory(cat);
    applyFilters(cat, searchQuery);
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    applyFilters(currentCategory, q);
  };

  // --------------------
  // LOAD MORE
  // --------------------
  const loadMore = () => {
    const currentCount = displayedProducts.length;
    const nextBatch = filteredProducts.slice(currentCount, currentCount + AppConfig.LOAD_MORE_COUNT);
    setDisplayedProducts([...displayedProducts, ...nextBatch]);
  };

  // --------------------
  // NAVIGATION
  // --------------------
  const goToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getProductImage = (product) => {
    if (product.image_url) return product.image_url;
    if (product.image_filename) {
      return `${AppConfig.API_BASE_URL}/images/products/${product.image_filename}`;
    }
    return 'https://via.placeholder.com/300?text=No+Image';
  };

  // --------------------
  // RENDER
  // --------------------
  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">⏳ Chargement des produits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">❌ {error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <div className="header">
        <h1>🚗 Pièces Auto Market</h1>
        <p className="subtitle">{allProducts.length} produits disponibles</p>
        
        {/* NOUVEAU: Bouton Scanner */}
        <button 
          onClick={() => navigate('/scan')} 
          className="scan-btn"
        >
          📸 Scanner une Pièce
        </button>
      </div>

      {/* Search */}
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-bar"
          placeholder="Rechercher (code, nom, description)..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Categories */}
      <div className="categories">
        <button
          className={currentCategory === 'all' ? 'category-btn active' : 'category-btn'}
          onClick={() => handleCategoryClick('all')}
        >
          Tout ({allProducts.length})
        </button>
        {categories.map(cat => {
          const count = allProducts.filter(p => 
            (p.categorieId?.nom || p.categorie) === cat
          ).length;
          return (
            <button
              key={cat}
              className={cat === currentCategory ? 'category-btn active' : 'category-btn'}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Results info */}
      {searchQuery && (
        <div className="results-info">
          {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''} pour "{searchQuery}"
        </div>
      )}

      {/* Products Grid */}
      <div className="products-grid">
        {displayedProducts.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-text">Aucun produit trouvé</div>
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setCurrentCategory('all');
                applyFilters('all', '');
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          displayedProducts.map(p => (
            <div 
              key={p._id} 
              className="product-card" 
              onClick={() => goToProductDetail(p._id)}
            >
              <div className="product-image-container">
                <img 
                  src={getProductImage(p)} 
                  alt={p.product_name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300?text=Image+Indisponible';
                  }}
                />
                {p.quantite_disponible === 0 && (
                  <div className="out-of-stock-badge">Rupture de stock</div>
                )}
              </div>
              <div className="product-info">
                <div className="product-name">{p.product_name}</div>
                <div className="product-price">{AppConfig.formatPrice(p.prix_unitaire_GNF)}</div>
                {p.categorieId?.nom && (
                  <div className="product-category">{p.categorieId.nom}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredProducts.length > displayedProducts.length && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={loadMore}>
            Charger plus ({filteredProducts.length - displayedProducts.length} restants)
          </button>
        </div>
      )}
    </div>
  );
}