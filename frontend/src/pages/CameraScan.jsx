// src/pages/CameraScan.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppConfig } from '../config.js';
import './CameraScan.css';

export default function CameraScan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [error, setError] = useState(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setIsLoading(false);
  };

  // Start camera
  const startCamera = async () => {
    setCameraActive(true);
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 0)); // ensure videoRef available

    try {
      if (stream) stream.getTracks().forEach(track => track.stop());

      const constraints = isMobile
        ? { video: { facingMode: { ideal: 'environment' }, width: 1920, height: 1080 }, audio: false }
        : { video: { width: 1280, height: 720 }, audio: false };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      videoRef.current.srcObject = mediaStream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      await videoRef.current.play();
      setStream(mediaStream);
      setIsLoading(false);

    } catch (err) {
      console.error('Camera error:', err);
      setError('Impossible d\'accéder à la caméra. ' + (err.message || ''));
      setCameraActive(false);
      setIsLoading(false);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  // Analyze captured image
  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setMatchedProducts([]);

    try {
      const response = await fetch(AppConfig.api('/image/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage.split(',')[1] }) // remove data:image prefix
      });

      if (!response.ok) throw new Error('Erreur lors de l\'analyse');

      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Erreur inconnue');

      setAnalysisResult(result.analysis);
      setMatchedProducts(result.matchedProducts || []);

      if (!result.matchedProducts || result.matchedProducts.length === 0) {
        setError('Aucun produit correspondant trouvé dans notre catalogue');
      }

    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'analyse de l\'image. Réessayez.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setMatchedProducts([]);
    setError(null);
    startCamera();
  };

  useEffect(() => () => stopCamera(), []); // cleanup on unmount

  const getProductImage = (product) => {
    if (product.image_url) return product.image_url;
    if (product.image_filename) return `${AppConfig.API_BASE_URL}/images/products/${product.image_filename}`;
    return 'https://via.placeholder.com/200?text=No+Image';
  };

  return (
    <div className="camera-scan-container">
      {/* Header */}
      <div className="scan-header">
        <button onClick={() => navigate('/')} className="back-btn">← Retour</button>
        <h1 className="scan-title">📸 Scanner une Pièce</h1>
      </div>

      {/* Instructions */}
      {!cameraActive && !capturedImage && (
        <div className="instructions">
          <div className="instruction-icon">📷</div>
          <h2>Comment ça marche ?</h2>
          <ol>
            <li>Activez votre caméra</li>
            <li>Prenez une photo claire de la pièce automobile</li>
            <li>Notre IA identifiera la pièce</li>
            <li>Trouvez des produits correspondants</li>
          </ol>
          <button onClick={startCamera} className="btn btn-primary btn-large" disabled={isLoading}>
            {isLoading ? '⏳ Chargement...' : '🎥 Activer la Caméra'}
          </button>
        </div>
      )}

      {/* Camera view */}
      {cameraActive && !capturedImage && (
        <div className="camera-view">
          <div className="video-container">
            <video ref={videoRef} autoPlay muted playsInline className="video-preview" />
            <div className="camera-overlay">
              <div className="focus-frame"></div>
              <div className="camera-hint">Centrez la pièce automobile dans le cadre</div>
            </div>
          </div>
          <div className="camera-controls">
            <button onClick={stopCamera} className="btn btn-secondary">Annuler</button>
            <button onClick={capturePhoto} className="btn btn-capture">📸 Capturer</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Captured image + analyze */}
      {capturedImage && !analysisResult && (
        <div className="captured-view">
          <img src={capturedImage} alt="Captured" className="captured-image" />
          {isAnalyzing ? <p>🔍 Analyse en cours...</p> : (
            <div className="capture-actions">
              <button onClick={reset} className="btn btn-secondary">🔄 Reprendre</button>
              <button onClick={analyzeImage} className="btn btn-primary">🤖 Analyser avec l'IA</button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {analysisResult && (
        <div className="results-view">
          <h2>🤖 Analyse IA</h2>
          <p><strong>Pièce Identifiée:</strong> {analysisResult.partName || 'Non identifiée'}</p>
          {analysisResult.description && <p>{analysisResult.description}</p>}
          {analysisResult.confidence !== undefined && (
            <div className="confidence-bar">
              <div className="confidence-label">Confiance: {Math.round(analysisResult.confidence * 100)}%</div>
              <div className="confidence-progress">
                <div className="confidence-fill" style={{ width: `${analysisResult.confidence * 100}%` }}></div>
              </div>
            </div>
          )}
          {analysisResult.category && <p><strong>Catégorie:</strong> {analysisResult.category}</p>}
          {analysisResult.possibleBrands && analysisResult.possibleBrands.length > 0 && (
            <p><strong>Marques possibles:</strong> {analysisResult.possibleBrands.join(', ')}</p>
          )}

          {matchedProducts.length > 0 && (
            <>
              <h2>✅ Produits Disponibles ({matchedProducts.length})</h2>
              <div className="matched-products-grid">
                {matchedProducts.map(p => (
                  <div key={p._id} className="matched-product-card" onClick={() => navigate(`/product/${p._id}`)}>
                    <img src={getProductImage(p)} alt={p.product_name} onError={e => e.target.src='https://via.placeholder.com/200?text=No+Image'} />
                    <div className="product-name">{p.product_name}</div>
                    <div className="product-price">{AppConfig.formatPrice(p.prix_unitaire_GNF)}</div>
                    {p.similarity && <div className="similarity-badge">{Math.round(p.similarity * 100)}% correspondance</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="results-actions">
            <button onClick={() => navigate('/')} className="btn btn-secondary">🏠 Accueil</button>
            <button onClick={reset} className="btn btn-primary">📸 Scanner Autre Pièce</button>
          </div>
        </div>
      )}

      {error && <div className="error-banner">⚠️ {error}</div>}
    </div>
  );
}
