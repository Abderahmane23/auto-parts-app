// ui/render.js
import { AppConfig } from '../config.js';

/* =====================
   CATEGORIES
===================== */
export function renderCategories(categories, onSelect) {
  const container = document.getElementById('categories');

  container.innerHTML = `
    <button class="category-btn active" data-category="all">Tout</button>
    ${categories
      .map(
        cat =>
          `<button class="category-btn" data-category="${cat}">${cat}</button>`
      )
      .join('')}
  `;

  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container
        .querySelectorAll('.category-btn')
        .forEach(b => b.classList.remove('active'));

      btn.classList.add('active');
      onSelect(btn.dataset.category);
    });
  });
}

/* =====================
   PRODUCTS GRID
===================== */
export function renderProducts(products, onClick) {
  const container = document.getElementById('productsGrid');

  if (products.length === 0) {
    container.innerHTML =
      '<div class="loading" style="grid-column:1/-1;">Aucun produit trouvé</div>';
    return;
  }

  container.innerHTML = products
    .map(product => {
      // Priorité : image_filename > image_url > image
      const imageFile = product.image_filename || 
                       product.image_url || 
                       product.image ||
                       'placeholder.jpg';
      
      const img = AppConfig.image(imageFile);
      const code = product.product_code || product.product_name?.split(' ')[0] || 'N/A';

      return `
        <div class="product-card" data-id="${product._id || ''}">
          <img
            class="product-image"
            src="${img}"
            alt="${product.product_name || 'Produit'}"
            onerror="this.src='https://via.placeholder.com/300?text=No+Image'"
          >
          <div class="product-info">
            <div class="product-code">${code}</div>
            <div class="product-name">${product.product_name || 'Sans nom'}</div>
            <div class="product-price">
              ${AppConfig.formatPrice(product.prix_unitaire_GNF || product.prixUnitaire || 0)} GNF
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.product-card').forEach((card, i) => {
    card.addEventListener('click', () => onClick(products[i]));
  });
}

/* =====================
   PRODUCT MODAL
===================== */
export function showProductModal(product) {
  const imageFile = product.image_filename || 
                   product.image_url || 
                   product.image ||
                   'placeholder.jpg';

  document.getElementById('modalImage').src = AppConfig.image(imageFile);

  document.getElementById('modalCode').textContent =
    'CODE: ' + (product.product_code || product.product_name?.split(' ')[0] || 'N/A');

  document.getElementById('modalName').textContent = product.product_name || 'Sans nom';
  
  document.getElementById('modalPrice').textContent =
    AppConfig.formatPrice(product.prix_unitaire_GNF || product.prixUnitaire || 0) + ' GNF';

  document.getElementById('modalDescription').textContent =
    product.description || 'Pas de description disponible';

  document.getElementById('modalCategory').textContent =
    product.categorieId?.nom || product.categorie || 'N/A';

  document.getElementById('modalStock').textContent =
    (product.quantite_disponible || product.quantite || 0) + ' unités';

  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}