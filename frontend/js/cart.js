/**
 * QuickKart Cart Page Controller
 * Manages full cart view on cart.html, quantity adjustments, coupons, bill calculations.
 */

async function initCartPage() {
  await refreshCart();
  renderFullCartPage();

  window.addEventListener('cartUpdated', () => {
    renderFullCartPage();
  });
}

function renderFullCartPage() {
  const container = document.getElementById('cart-page-content');
  if (!container) return;

  const cart = window.currentCart;

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; margin: 40px 0;">
        <div class="empty-state-icon">🛒</div>
        <h2 class="empty-state-title">Your QuickKart cart is currently empty</h2>
        <p class="empty-state-sub">Browse fresh veggies, dairy, soft drinks, and daily groceries delivered in 10 minutes.</p>
        <a href="/products" class="btn-primary" style="display:inline-flex;">Start Shopping</a>
      </div>
    `;
    return;
  }

  const freeDeliveryPercent = Math.min(100, Math.round((cart.subtotal / cart.free_delivery_threshold) * 100));
  const isFreeDelivery = cart.subtotal >= cart.free_delivery_threshold || cart.delivery_charge === 0;

  container.innerHTML = `
    <!-- Left Column: Cart Items -->
    <div class="cart-items-column">
      <!-- Delivery Estimate Banner -->
      <div class="delivery-eta-banner" style="margin-bottom:16px;">
        <div class="eta-banner-icon">⚡</div>
        <div>
          <div class="eta-banner-title">Superfast 10-15 Minute Delivery</div>
          <div class="eta-banner-sub">Delivering to <strong>${getActiveLocation().name}</strong> (${getActiveLocation().address})</div>
        </div>
      </div>

      <!-- Free Delivery Meter -->
      <div class="free-delivery-meter" style="margin-bottom:16px;">
        <div class="meter-text">
          <span>🚚</span>
          ${isFreeDelivery 
            ? `<span>Congratulations! Your order qualifies for <strong>FREE Delivery</strong></span>`
            : `<span>Add items worth <strong>₹${Math.round(cart.amount_needed_for_free_delivery)}</strong> more to get FREE Delivery!</span>`
          }
        </div>
        <div class="meter-progress-track">
          <div class="meter-progress-bar" style="width: ${freeDeliveryPercent}%;"></div>
        </div>
      </div>

      <!-- Cart Items Card -->
      <div class="cart-items-card" style="padding:10px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #eee;">
          <h3 style="font-size:16px;font-weight:800;">Items in Cart (${cart.total_quantity})</h3>
          <button class="btn-clear-cart" style="height:32px;padding:0 10px;font-size:12px;" onclick="handleClearCartAction()">Clear All</button>
        </div>

        ${cart.items.map(item => `
          <div class="cart-item-row" style="padding:16px 0;">
            <div class="cart-item-thumb" style="width:64px;height:64px;">
              <img src="${item.image_url}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name" style="font-size:14px;font-weight:700;">${item.name}</div>
              <div class="cart-item-weight">${item.weight}</div>
              <div class="cart-item-pricing">
                <span class="cart-item-price" style="font-size:15px;">₹${Math.round(item.price)}</span>
                ${item.original_price > item.price ? `<span class="cart-item-mrp">₹${Math.round(item.original_price)}</span>` : ''}
              </div>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-stepper" style="height:34px;min-width:84px;">
                <button class="stepper-btn" onclick="handleCardQtyChange(event, '${item.product_id}', ${item.quantity - 1})">−</button>
                <span class="stepper-value">${item.quantity}</span>
                <button class="stepper-btn" onclick="handleCardQtyChange(event, '${item.product_id}', ${item.quantity + 1})">+</button>
              </div>
              <button class="cart-item-remove-btn" onclick="handleCardQtyChange(event, '${item.product_id}', 0)" title="Remove item">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Right Column: Coupons & Bill Summary -->
    <div class="cart-summary-column">
      <!-- Coupon Section -->
      <div class="coupon-section-card" style="margin-bottom:20px;">
        <div class="coupon-heading">🏷️ Apply Coupons & Offers</div>
        ${cart.coupon_code ? `
          <div class="applied-coupon-pill">
            <span>Coupon <strong>${cart.coupon_code}</strong> active</span>
            <span class="remove-coupon-btn" onclick="handleRemoveCoupon()">Remove</span>
          </div>
        ` : `
          <div class="coupon-input-group">
            <input type="text" id="page-coupon-input" class="coupon-input" placeholder="ENTER CODE">
            <button class="btn-apply-coupon" onclick="handleApplyPageCoupon()">APPLY</button>
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
              <span class="coupon-chip-desc">Free Delivery on any order</span>
            </div>
          </div>
        `}
      </div>

      <!-- Bill Details -->
      <div class="bill-details-card">
        <div class="bill-title">Order Summary</div>
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
            <span>Coupon Savings</span>
            <span>-₹${Math.round(cart.discount)}</span>
          </div>
        ` : ''}
        <div class="bill-row total-row">
          <span>To Pay</span>
          <span>₹${Math.round(cart.grand_total)}</span>
        </div>
        ${cart.total_savings > 0 ? `
          <div class="savings-banner">
            🎉 You save ₹${Math.round(cart.total_savings)} on this purchase!
          </div>
        ` : ''}

        <a href="/checkout" class="btn-proceed-checkout" style="margin-top:20px;text-align:center;justify-content:center;">
          <span>Proceed to Checkout</span>
          <span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;font-size:13px;">₹${Math.round(cart.grand_total)}</span>
        </a>

        <div class="security-trust-badge">
          <span>🔒 100% Safe & Secure Checkout</span>
        </div>
      </div>
    </div>
  `;
}

async function handleApplyPageCoupon() {
  const input = document.getElementById('page-coupon-input');
  if (!input || !input.value.trim()) {
    showToast('Please enter a coupon code', 'error');
    return;
  }
  await handleApplyDirectCoupon(input.value.trim());
}

document.addEventListener('DOMContentLoaded', initCartPage);
