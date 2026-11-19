/**
 * QuickKart Main Application Engine
 * Handles global state, cart sync, toasts, location selector, modals.
 */

// Global State
window.currentCart = {
  items: [],
  item_count: 0,
  total_quantity: 0,
  subtotal: 0,
  handling_charge: 2,
  delivery_charge: 15,
  discount: 0,
  coupon_code: null,
  grand_total: 0,
  total_savings: 0,
  free_delivery_threshold: 199,
  amount_needed_for_free_delivery: 0
};

// Demo Bengaluru Locations
const DEMO_LOCATIONS = [
  { name: "Indiranagar", address: "100ft Road, Indiranagar, Bengaluru", eta: "10-12 mins", pincode: "560038" },
  { name: "Koramangala", address: "5th Block, Koramangala, Bengaluru", eta: "9-11 mins", pincode: "560095" },
  { name: "HSR Layout", address: "Sector 2, HSR Layout, Bengaluru", eta: "11-13 mins", pincode: "560102" },
  { name: "Whitefield", address: "ITPB Main Rd, Whitefield, Bengaluru", eta: "12-15 mins", pincode: "560066" },
  { name: "Marathahalli", address: "Outer Ring Rd, Marathahalli, Bengaluru", eta: "10-14 mins", pincode: "560037" },
  { name: "Electronic City", address: "Phase 1, Electronic City, Bengaluru", eta: "12-15 mins", pincode: "560100" },
  { name: "Jayanagar", address: "4th Block, Jayanagar, Bengaluru", eta: "10-12 mins", pincode: "560011" }
];

// Active location
function getActiveLocation() {
  const saved = localStorage.getItem('quickkart_location');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_) {}
  }
  return DEMO_LOCATIONS[0]; // Indiranagar default
}

function setActiveLocation(loc) {
  localStorage.setItem('quickkart_location', JSON.stringify(loc));
  updateHeaderLocationDisplay();
  showToast(`Delivery location set to ${loc.name}!`, 'success');
}

function updateHeaderLocationDisplay() {
  const loc = getActiveLocation();
  const nameEl = document.getElementById('selected-location-name');
  const etaEl = document.getElementById('selected-location-eta');
  const addrEl = document.getElementById('selected-location-address');

  if (nameEl) nameEl.textContent = loc.name;
  if (etaEl) etaEl.textContent = loc.eta;
  if (addrEl) addrEl.textContent = loc.address;
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '⚡' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ==================== CART SYNCHRONIZATION ====================
async function refreshCart() {
  try {
    const cart = await api.getCart();
    window.currentCart = cart;
    updateCartUI();
    updateAllProductCardButtons();
    // Dispatch custom event for page listeners
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  } catch (err) {
    console.error('Failed to sync cart:', err);
  }
}

function updateCartUI() {
  const cart = window.currentCart;
  const countBadges = document.querySelectorAll('.cart-badge-count');
  const totalSpans = document.querySelectorAll('.cart-btn-total');
  const itemsSpans = document.querySelectorAll('.cart-btn-items');
  const mobileBar = document.getElementById('mobile-cart-bar');

  countBadges.forEach(b => {
    b.textContent = cart.total_quantity;
    b.style.display = cart.total_quantity > 0 ? 'flex' : 'none';
  });

  totalSpans.forEach(s => {
    s.textContent = cart.grand_total > 0 ? `₹${Math.round(cart.grand_total)}` : '₹0';
  });

  itemsSpans.forEach(s => {
    s.textContent = cart.total_quantity === 1 ? '1 item' : `${cart.total_quantity} items`;
  });

  // Mobile Bottom Bar Sync
  if (mobileBar) {
    if (cart.total_quantity > 0) {
      mobileBar.classList.add('active');
      document.body.classList.add('has-cart-bar');
      const mbCount = document.getElementById('mobile-cart-count');
      const mbTotal = document.getElementById('mobile-cart-total');
      if (mbCount) mbCount.textContent = `${cart.total_quantity} ${cart.total_quantity === 1 ? 'ITEM' : 'ITEMS'}`;
      if (mbTotal) mbTotal.textContent = `₹${Math.round(cart.grand_total)}`;
    } else {
      mobileBar.classList.remove('active');
      document.body.classList.remove('has-cart-bar');
    }
  }

  // Update Drawer / Cart Page if active
  if (typeof renderCartDrawerItems === 'function') {
    renderCartDrawerItems();
  }
}

function getProductQuantityInCart(productId) {
  if (!window.currentCart || !window.currentCart.items) return 0;
  const item = window.currentCart.items.find(i => i.product_id === productId);
  return item ? item.quantity : 0;
}

// Update Add button / Stepper across cards
function updateProductCardButton(cardElement, productId, inStock = true) {
  const container = cardElement.querySelector(`.product-add-wrapper[data-product-id="${productId}"]`);
  if (!container) return;

  if (!inStock) {
    container.innerHTML = `<button class="btn-add-item out-of-stock" disabled>OUT OF STOCK</button>`;
    return;
  }

  const qty = getProductQuantityInCart(productId);

  if (qty > 0) {
    container.innerHTML = `
      <div class="quantity-stepper">
        <button class="stepper-btn stepper-minus" onclick="handleCardQtyChange(event, '${productId}', ${qty - 1})">−</button>
        <span class="stepper-value">${qty}</span>
        <button class="stepper-btn stepper-plus" onclick="handleCardQtyChange(event, '${productId}', ${qty + 1})">+</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-add-item" onclick="handleCardAddToCart(event, '${productId}')">ADD</button>
    `;
  }
}

function updateAllProductCardButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    const pid = card.dataset.productId;
    const stock = card.dataset.inStock !== 'false';
    if (pid) {
      updateProductCardButton(card, pid, stock);
    }
  });

  // Also update product modal button if open
  const modalWrap = document.getElementById('modal-add-wrapper');
  if (modalWrap && modalWrap.dataset.productId) {
    const pid = modalWrap.dataset.productId;
    const stock = modalWrap.dataset.inStock !== 'false';
    updateProductCardButton(document.getElementById('product-detail-modal'), pid, stock);
  }
}

// Handle Add to Cart action from product cards
async function handleCardAddToCart(e, productId) {
  if (e) e.stopPropagation();
  try {
    const updatedCart = await api.addToCart(productId, 1);
    window.currentCart = updatedCart;
    updateCartUI();
    updateAllProductCardButtons();
    showToast('Item added to cart!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Handle Stepper (+ / -) from product cards
async function handleCardQtyChange(e, productId, newQty) {
  if (e) e.stopPropagation();
  try {
    let updatedCart;
    if (newQty <= 0) {
      updatedCart = await api.removeFromCart(productId);
      showToast('Item removed from cart', 'success');
    } else {
      updatedCart = await api.updateCartItem(productId, newQty);
    }
    window.currentCart = updatedCart;
    updateCartUI();
    updateAllProductCardButtons();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==================== PRODUCT CARD HTML GENERATOR ====================
function createProductCardHTML(p) {
  const inStock = p.stock_availability !== false;
  const currentPrice = Math.round(p.price);
  const originalPrice = Math.round(p.original_price);
  const discount = p.discount || 0;
  const eta = p.delivery_estimate || '10 MINS';

  return `
    <div class="product-card" data-product-id="${p.id}" data-in-stock="${inStock}">
      <div class="product-img-container" onclick="openProductDetailModal('${p.id}')">
        <span class="product-eta-badge">⚡ ${eta}</span>
        ${discount > 0 ? `<span class="product-discount-badge">${discount}% OFF</span>` : ''}
        <img class="product-img" src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='/static/assets/images/image-fallback.svg'">
      </div>
      <div class="product-info">
        <h4 class="product-name" onclick="openProductDetailModal('${p.id}')" title="${p.name}">${p.name}</h4>
        <div class="product-weight">${p.weight}</div>
        <div class="product-footer">
          <div class="product-price-box">
            <span class="product-current-price">₹${currentPrice}</span>
            ${originalPrice > currentPrice ? `<span class="product-original-price">₹${originalPrice}</span>` : ''}
          </div>
          <div class="product-add-wrapper" data-product-id="${p.id}">
            ${!inStock ? `<button class="btn-add-item out-of-stock" disabled>OUT OF STOCK</button>` : `<button class="btn-add-item" onclick="handleCardAddToCart(event, '${p.id}')">ADD</button>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==================== PRODUCT DETAIL MODAL ====================
async function openProductDetailModal(productId) {
  const modal = document.getElementById('product-detail-modal');
  if (!modal) return;

  try {
    const p = await api.getProduct(productId);
    const inStock = p.stock_availability !== false;
    const body = document.getElementById('product-modal-body');

    body.innerHTML = `
      <div class="product-detail-modal-body">
        <div class="modal-product-img-box">
          <span class="product-eta-badge" style="top:12px;left:12px;">⚡ ${p.delivery_estimate || '10 MINS'}</span>
          <img class="modal-product-img" src="${p.image_url}" alt="${p.name}">
        </div>
        <div class="modal-product-details">
          <div class="badge-veg" style="margin-bottom:8px;"></div>
          <h2 class="modal-product-name">${p.name}</h2>
          <div class="modal-product-weight">${p.weight}</div>
          
          <div class="modal-price-row">
            <span class="modal-current-price">₹${Math.round(p.price)}</span>
            ${p.original_price > p.price ? `<span class="modal-original-price">₹${Math.round(p.original_price)}</span>` : ''}
            ${p.discount > 0 ? `<span class="modal-discount-tag">${p.discount}% OFF</span>` : ''}
          </div>

          <div class="modal-desc-heading">Product Details</div>
          <p class="modal-product-desc">${p.description}</p>

          <div class="modal-product-meta">
            <div class="meta-pill">⭐ ${p.rating || 4.8} (${p.rating_count || 120} reviews)</div>
            <div class="meta-pill">⚡ Guaranteed 10m Delivery</div>
          </div>

          <div class="modal-action-row">
            <div id="modal-add-wrapper" class="product-add-wrapper" data-product-id="${p.id}" data-in-stock="${inStock}">
              ${!inStock ? `<button class="btn-add-item out-of-stock" disabled>OUT OF STOCK</button>` : `<button class="btn-add-item" onclick="handleCardAddToCart(event, '${p.id}')">ADD TO CART</button>`}
            </div>
            <a href="/cart" class="btn-secondary" style="display:inline-flex;align-items:center;padding:7px 16px;">View Cart</a>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    updateProductCardButton(modal, p.id, inStock);
  } catch (err) {
    showToast('Failed to load product details', 'error');
  }
}

function closeProductDetailModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.remove('active');
}

// ==================== LOCATION MODAL ====================
function openLocationModal() {
  const modal = document.getElementById('location-modal');
  if (!modal) return;

  const current = getActiveLocation();
  const listEl = document.getElementById('modal-location-list');
  if (listEl) {
    listEl.innerHTML = DEMO_LOCATIONS.map(loc => `
      <div class="location-item-btn ${loc.name === current.name ? 'selected' : ''}" onclick="selectLocationByName('${loc.name}')">
        <div class="location-pin-icon">📍</div>
        <div class="location-item-info">
          <div class="location-item-name">${loc.name}</div>
          <div class="location-item-meta">${loc.eta} • ${loc.address}</div>
        </div>
      </div>
    `).join('');
  }
  modal.classList.add('active');
}

function closeLocationModal() {
  const modal = document.getElementById('location-modal');
  if (modal) modal.classList.remove('active');
}

function selectLocationByName(name) {
  const loc = DEMO_LOCATIONS.find(l => l.name === name);
  if (loc) {
    setActiveLocation(loc);
    closeLocationModal();
  }
}

// ==================== CART DRAWER ====================
function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer-overlay');
  if (drawer) {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
    refreshCart();
  } else {
    // If on a page without drawer, redirect to /cart
    window.location.href = '/cart';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer-overlay');
  if (drawer) {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Render items inside the drawer
function renderCartDrawerItems() {
  const body = document.getElementById('cart-drawer-content');
  if (!body) return;

  const cart = window.currentCart;

  if (!cart.items || cart.items.length === 0) {
    body.innerHTML = `
      <div class="cart-empty-view">
        <div class="cart-empty-icon">🛒</div>
        <h3 class="cart-empty-title">Your cart is empty</h3>
        <p class="cart-empty-sub">Explore our farm fresh fruits, dairy and delicious munchies!</p>
        <button class="btn-primary" onclick="closeCartDrawer(); window.location.href='/products';">Start Shopping</button>
      </div>
    `;
    const footer = document.getElementById('cart-drawer-footer');
    if (footer) footer.style.display = 'none';
    return;
  }

  const footer = document.getElementById('cart-drawer-footer');
  if (footer) footer.style.display = 'block';

  const freeDeliveryPercent = Math.min(100, Math.round((cart.subtotal / cart.free_delivery_threshold) * 100));
  const isFreeDelivery = cart.subtotal >= cart.free_delivery_threshold || cart.delivery_charge === 0;

  body.innerHTML = `
    <!-- Delivery Time Banner -->
    <div class="delivery-eta-banner">
      <div class="eta-banner-icon">⚡</div>
      <div>
        <div class="eta-banner-title">Delivery in 10-15 minutes</div>
        <div class="eta-banner-sub">Delivering to ${getActiveLocation().name}</div>
      </div>
    </div>

    <!-- Free Delivery Meter -->
    <div class="free-delivery-meter">
      <div class="meter-text">
        <span>🚚</span>
        ${isFreeDelivery 
          ? `<span>Congratulations! You get <strong>FREE delivery</strong></span>`
          : `<span>Add ₹${Math.round(cart.amount_needed_for_free_delivery)} more for <strong>FREE delivery</strong></span>`
        }
      </div>
      <div class="meter-progress-track">
        <div class="meter-progress-bar" style="width: ${freeDeliveryPercent}%;"></div>
      </div>
    </div>

    <!-- Items List -->
    <div class="cart-items-card">
      ${cart.items.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-thumb">
            <img src="${item.image_url}" alt="${item.name}">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name" title="${item.name}">${item.name}</div>
            <div class="cart-item-weight">${item.weight}</div>
            <div class="cart-item-pricing">
              <span class="cart-item-price">₹${Math.round(item.price)}</span>
              ${item.original_price > item.price ? `<span class="cart-item-mrp">₹${Math.round(item.original_price)}</span>` : ''}
            </div>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-stepper">
              <button class="stepper-btn" onclick="handleCardQtyChange(event, '${item.product_id}', ${item.quantity - 1})">−</button>
              <span class="stepper-value">${item.quantity}</span>
              <button class="stepper-btn" onclick="handleCardQtyChange(event, '${item.product_id}', ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-remove-btn" onclick="handleCardQtyChange(event, '${item.product_id}', 0)" title="Remove item">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Coupons Card -->
    <div class="coupon-section-card">
      <div class="coupon-heading">🏷️ Apply Promo Code</div>
      ${cart.coupon_code ? `
        <div class="applied-coupon-pill">
          <span>Coupon <strong>${cart.coupon_code}</strong> applied</span>
          <span class="remove-coupon-btn" onclick="handleRemoveCoupon()">Remove</span>
        </div>
      ` : `
        <div class="coupon-input-group">
          <input type="text" id="drawer-coupon-input" class="coupon-input" placeholder="ENTER COUPON CODE">
          <button class="btn-apply-coupon" onclick="handleApplyDrawerCoupon()">APPLY</button>
        </div>
        <div class="coupon-chips-list">
          <div class="coupon-chip" onclick="handleApplyDirectCoupon('WELCOME10')">
            <span class="coupon-chip-code">WELCOME10</span>
            <span class="coupon-chip-desc">10% OFF on ₹100+</span>
          </div>
          <div class="coupon-chip" onclick="handleApplyDirectCoupon('FLAT50')">
            <span class="coupon-chip-code">FLAT50</span>
            <span class="coupon-chip-desc">Flat ₹50 OFF on ₹300+</span>
          </div>
          <div class="coupon-chip" onclick="handleApplyDirectCoupon('FREESHIP')">
            <span class="coupon-chip-code">FREESHIP</span>
            <span class="coupon-chip-desc">Free Delivery</span>
          </div>
        </div>
      `}
    </div>

    <!-- Bill Details -->
    <div class="bill-details-card">
      <div class="bill-title">Bill Details</div>
      <div class="bill-row">
        <span>Items Total</span>
        <span>₹${Math.round(cart.subtotal)}</span>
      </div>
      <div class="bill-row">
        <span>Delivery Charge</span>
        <span>${cart.delivery_charge === 0 ? `<span style="color:var(--primary-green);font-weight:700;">FREE</span>` : `₹${Math.round(cart.delivery_charge)}`}</span>
      </div>
      <div class="bill-row">
        <span>Handling Charge</span>
        <span>₹${Math.round(cart.handling_charge)}</span>
      </div>
      ${cart.discount > 0 ? `
        <div class="bill-row discount-row">
          <span>Coupon Discount</span>
          <span>-₹${Math.round(cart.discount)}</span>
        </div>
      ` : ''}
      <div class="bill-row total-row">
        <span>Grand Total</span>
        <span>₹${Math.round(cart.grand_total)}</span>
      </div>
      ${cart.total_savings > 0 ? `
        <div class="savings-banner">
          🎉 You saved a total of ₹${Math.round(cart.total_savings)} on this order!
        </div>
      ` : ''}
    </div>
  `;

  // Update Drawer Footer Proceed button text
  const totalDisplay = document.getElementById('drawer-footer-total');
  if (totalDisplay) {
    totalDisplay.textContent = `₹${Math.round(cart.grand_total)}`;
  }
}

async function handleApplyDrawerCoupon() {
  const input = document.getElementById('drawer-coupon-input');
  if (!input || !input.value.trim()) {
    showToast('Please enter a coupon code', 'error');
    return;
  }
  await handleApplyDirectCoupon(input.value.trim());
}

async function handleApplyDirectCoupon(code) {
  try {
    const val = await api.validateCoupon(code, window.currentCart.subtotal);
    if (!val.valid) {
      showToast(val.message, 'error');
      return;
    }
    // Set coupon via checkout request or reload cart
    const updated = await api.request(`/api/checkout/coupon?code=${encodeURIComponent(code)}`, {
      method: 'POST'
    }).catch(async () => {
      // Direct client-side coupon sync with cart
      window.currentCart.coupon_code = code;
      return api.getCart();
    });
    showToast(`Coupon ${code} applied successfully!`, 'success');
    await refreshCart();
  } catch (err) {
    showToast(err.message || 'Invalid coupon code', 'error');
  }
}

async function handleRemoveCoupon() {
  try {
    window.currentCart.coupon_code = null;
    showToast('Coupon removed', 'success');
    await refreshCart();
  } catch (err) {
    console.error(err);
  }
}

async function handleClearCartAction() {
  if (confirm('Are you sure you want to clear your cart?')) {
    try {
      await api.clearCart();
      await refreshCart();
      showToast('Cart cleared', 'success');
    } catch (err) {
      showToast('Failed to clear cart', 'error');
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderLocationDisplay();
  refreshCart();

  // Close modals on overlay click or Escape
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  const drawerOverlay = document.getElementById('cart-drawer-overlay');
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeCartDrawer();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLocationModal();
      closeProductDetailModal();
      closeCartDrawer();
    }
  });
});
