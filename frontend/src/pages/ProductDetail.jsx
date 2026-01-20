// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppConfig } from '../config.js';
import './ProductDetail.css';  // ← Import du fichier CSS

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(AppConfig.api(`/pieces/${id}`));
      
      if (!response.ok) {
        throw new Error('Produit non trouvé');
      }

      const json = await response.json();
      setProduct(json.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement du produit:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (product) => {
    if (product?.image_url) return product.image_url;
    if (product?.image_filename) {
      return `${AppConfig.API_BASE_URL}/images/products/${product.image_filename}`;
    }
    return 'https://via.placeholder.com/400?text=No+Image';
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">⏳ Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <div className="error">❌ {error}</div>
          <button onClick={() => navigate('/')} className="back-button">
            ← Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="product-detail-container">
      {/* Header avec bouton retour */}
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Retour
        </button>
        <h1 className="detail-title">Détails du produit</h1>
      </div>

      {/* Image principale */}
      <div className="detail-image-container">
        <img
          src={getProductImage(product)}
          alt={product.product_name}
          className="detail-main-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400?text=Image+Indisponible';
          }}
        />
      </div>

      {/* Informations produit */}
      <div className="detail-content">
        <h2 className="product-title">{product.product_name}</h2>
        
        <div className="product-price-large">
          {AppConfig.formatPrice(product.prix_unitaire_GNF)}
        </div>

        {/* Badges */}
        <div className="product-badges">
          {product.categorieId?.nom && (
            <span className="badge badge-category">
              {product.categorieId.nom}
            </span>
          )}
          <span className={`badge ${product.quantite_disponible > 0 ? 'badge-success' : 'badge-danger'}`}>
            {product.quantite_disponible > 0 
              ? `En stock (${product.quantite_disponible})` 
              : 'Rupture de stock'}
          </span>
        </div>

        {/* Description */}
        {product.description && (
          <div className="product-section">
            <h3>Description</h3>
            <p className="product-description">{product.description}</p>
          </div>
        )}

        {/* Informations techniques */}
        <div className="product-section">
          <h3>Informations techniques</h3>
          <div className="product-info-grid">
            {product.code_piece && (
              <div className="info-item">
                <span className="info-label">Code pièce</span>
                <span className="info-value">{product.code_piece}</span>
              </div>
            )}
            {product.marque && (
              <div className="info-item">
                <span className="info-label">Marque</span>
                <span className="info-value">{product.marque}</span>
              </div>
            )}
            {product.modele && (
              <div className="info-item">
                <span className="info-label">Modèle</span>
                <span className="info-value">{product.modele}</span>
              </div>
            )}
            {product.annee && (
              <div className="info-item">
                <span className="info-label">Année</span>
                <span className="info-value">{product.annee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="action-buttons">
          <button className="btn btn-primary" disabled={product.quantite_disponible === 0}>
            Ajouter au panier
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  );
}