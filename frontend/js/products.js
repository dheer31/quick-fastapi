/**
 * QuickKart Product Listing Page Controller
 * Manages category filters, search results, price/discount sorting, and grid rendering.
 */

let currentProducts = [];
let activeCategory = 'all';
let activeSort = 'popular';
let inStockOnly = false;
let discountOnly = false;
let currentSearchQuery = '';

async function initProductsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  const collectionParam = urlParams.get('collection');
  const searchParam = urlParams.get('search');
  const sortParam = urlParams.get('sort');

  if (categoryParam) activeCategory = categoryParam;
  if (searchParam) currentSearchQuery = searchParam;
  if (sortParam) activeSort = sortParam;

  // Sync sort select element if present
  const sortSelect = document.getElementById('listing-sort-select');
  if (sortSelect) sortSelect.value = activeSort;

  // Load Categories into Sidebar
  await loadSidebarCategories();

  // Load and render Products
  await fetchAndRenderProducts(collectionParam);

  // Setup Event Listeners
  setupListingEventListeners();
}

async function loadSidebarCategories() {
  const listEl = document.getElementById('sidebar-categories-list');
  if (!listEl) return;

  try {
    const categories = await api.getCategories();
    let html = `
      <div class="sidebar-cat-item ${activeCategory === 'all' && !currentSearchQuery ? 'active' : ''}" onclick="filterByCategory('all')">
        <span>All Products</span>
        <span style="font-size:11px;opacity:0.7;">Browse</span>
      </div>
    `;

    categories.forEach(cat => {
      const isActive = activeCategory === cat.id;
      html += `
        <div class="sidebar-cat-item ${isActive ? 'active' : ''}" onclick="filterByCategory('${cat.id}')">
          <span>${cat.name}</span>
          <span style="font-size:11px;opacity:0.7;">${cat.product_count}</span>
        </div>
      `;
    });

    listEl.innerHTML = html;
  } catch (err) {
    console.error('Failed to load sidebar categories:', err);
  }
}

async function fetchAndRenderProducts(collectionParam = null) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('listing-total-count');
  const titleEl = document.getElementById('listing-page-title');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px;color:#888;">Loading fresh groceries...</div>`;

  try {
    let products = [];

    if (currentSearchQuery) {
      if (titleEl) titleEl.textContent = `Search results for "${currentSearchQuery}"`;
      products = await api.searchProducts(currentSearchQuery, 50);
    } else {
      const params = {
        category: activeCategory !== 'all' ? activeCategory : undefined,
        collection: collectionParam || undefined,
        sort: activeSort,
        discount: discountOnly ? true : undefined,
        in_stock_only: inStockOnly ? true : undefined
      };

      if (titleEl) {
        if (activeCategory !== 'all') {
          // Format category title nicely
          titleEl.textContent = activeCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else if (collectionParam) {
          titleEl.textContent = collectionParam;
        } else {
          titleEl.textContent = "All Grocery & Essentials";
        }
      }

      const res = await api.getProducts(params);
      products = res.products || [];
    }

    // Client-side additional filters if search mode was active
    if (inStockOnly) {
      products = products.filter(p => p.stock_availability !== false);
    }
    if (discountOnly) {
      products = products.filter(p => p.discount > 0);
    }

    // Client-side sort if search results returned
    if (activeSort === 'price_low') {
      products.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_high') {
      products.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'discount') {
      products.sort((a, b) => b.discount - a.discount);
    }

    currentProducts = products;

    if (countEl) {
      countEl.innerHTML = `Showing <strong>${products.length}</strong> items`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛒</div>
          <h3 class="empty-state-title">No products match your criteria</h3>
          <p class="empty-state-sub">Try selecting another category or clear your filters.</p>
          <button class="btn-primary" onclick="resetAllFilters()">View All Products</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(p => createProductCardHTML(p)).join('');
    updateAllProductCardButtons();
  } catch (err) {
    console.error('Failed to load products:', err);
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>Failed to load products. Please try again.</p></div>`;
  }
}

function filterByCategory(catId) {
  activeCategory = catId;
  currentSearchQuery = '';
  // Update browser URL cleanly without page reload
  const newUrl = catId === 'all' ? '/products' : `/products?category=${catId}`;
  window.history.pushState({}, '', newUrl);

  // Update active styling in sidebar
  document.querySelectorAll('.sidebar-cat-item').forEach(item => {
    item.classList.remove('active');
  });

  loadSidebarCategories();
  fetchAndRenderProducts();
}

function resetAllFilters() {
  activeCategory = 'all';
  currentSearchQuery = '';
  inStockOnly = false;
  discountOnly = false;
  activeSort = 'popular';

  const inStockCheck = document.getElementById('filter-in-stock');
  const discountCheck = document.getElementById('filter-discount');
  const sortSelect = document.getElementById('listing-sort-select');

  if (inStockCheck) inStockCheck.checked = false;
  if (discountCheck) discountCheck.checked = false;
  if (sortSelect) sortSelect.value = 'popular';

  window.history.pushState({}, '', '/products');
  loadSidebarCategories();
  fetchAndRenderProducts();
}

function setupListingEventListeners() {
  const sortSelect = document.getElementById('listing-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      fetchAndRenderProducts();
    });
  }

  const inStockCheck = document.getElementById('filter-in-stock');
  if (inStockCheck) {
    inStockCheck.addEventListener('change', (e) => {
      inStockOnly = e.target.checked;
      fetchAndRenderProducts();
    });
  }

  const discountCheck = document.getElementById('filter-discount');
  if (discountCheck) {
    discountCheck.addEventListener('change', (e) => {
      discountOnly = e.target.checked;
      fetchAndRenderProducts();
    });
  }
}

document.addEventListener('DOMContentLoaded', initProductsPage);
