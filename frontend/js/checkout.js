/**
 * QuickKart Checkout Controller
 * Manages delivery address collection, locality selector, demo payment, and order submission.
 */

let selectedLocality = "Indiranagar";
let selectedPaymentMethod = "cod";

async function initCheckoutPage() {
  await refreshCart();

  // If cart is empty, redirect to cart page
  if (!window.currentCart.items || window.currentCart.items.length === 0) {
    showToast('Your cart is empty! Add items first.', 'error');
    setTimeout(() => {
      window.location.href = '/products';
    }, 1000);
    return;
  }

  // Pre-fill active location
  const loc = getActiveLocation();
  selectedLocality = loc.name;

  renderCheckoutSummary();
  setupLocalityChips();
  setupPaymentMethodToggles();
  setupFormSubmit();
}

function renderCheckoutSummary() {
  const summaryBox = document.getElementById('checkout-order-summary');
  if (!summaryBox) return;

  const cart = window.currentCart;

  summaryBox.innerHTML = `
    <div class="bill-title">Order Items (${cart.total_quantity})</div>
    <div style="max-height: 220px; overflow-y: auto; margin-bottom: 14px; padding-right: 4px;">
      ${cart.items.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${item.name}</div>
            <div style="font-size:11px;color:var(--text-secondary);">${item.weight} × ${item.quantity}</div>
          </div>
          <div style="font-weight:700;">₹${Math.round(item.item_total)}</div>
        </div>
      `).join('')}
    </div>

    <div class="bill-row">
      <span>Items Subtotal</span>
      <span>₹${Math.round(cart.subtotal)}</span>
    </div>
    <div class="bill-row">
      <span>Delivery Fee</span>
      <span>${cart.delivery_charge === 0 ? `<span style="color:var(--primary-green);font-weight:700;">FREE</span>` : `₹${Math.round(cart.delivery_charge)}`}</span>
    </div>
    <div class="bill-row">
      <span>Handling Charge</span>
      <span>₹${Math.round(cart.handling_charge)}</span>
    </div>
    ${cart.discount > 0 ? `
      <div class="bill-row discount-row">
        <span>Coupon (${cart.coupon_code})</span>
        <span>-₹${Math.round(cart.discount)}</span>
      </div>
    ` : ''}
    <div class="bill-row total-row">
      <span>Total Amount</span>
      <span>₹${Math.round(cart.grand_total)}</span>
    </div>
    ${cart.total_savings > 0 ? `
      <div class="savings-banner">
        🎉 You are saving ₹${Math.round(cart.total_savings)} on this order!
      </div>
    ` : ''}

    <button type="submit" form="checkout-form" id="btn-place-order" class="btn-primary" style="width:100%;height:48px;margin-top:20px;font-size:15px;">
      <span>Place Order • ₹${Math.round(cart.grand_total)}</span>
    </button>

    <div class="security-trust-badge">
      <span>🔒 100% Safe Demo Checkout</span>
    </div>
  `;
}

function setupLocalityChips() {
  const container = document.getElementById('checkout-locality-chips');
  if (!container) return;

  container.innerHTML = DEMO_LOCATIONS.map(loc => `
    <div class="locality-chip ${loc.name === selectedLocality ? 'selected' : ''}" onclick="selectCheckoutLocality('${loc.name}', '${loc.pincode}')">
      📍 ${loc.name}
    </div>
  `).join('');

  // Default pincode input
  const pincodeInput = document.getElementById('checkout-pincode');
  const activeLoc = DEMO_LOCATIONS.find(l => l.name === selectedLocality);
  if (pincodeInput && activeLoc) {
    pincodeInput.value = activeLoc.pincode;
  }
}

function selectCheckoutLocality(name, pincode) {
  selectedLocality = name;
  document.querySelectorAll('.locality-chip').forEach(chip => {
    if (chip.textContent.includes(name)) chip.classList.add('selected');
    else chip.classList.remove('selected');
  });

  const pincodeInput = document.getElementById('checkout-pincode');
  if (pincodeInput) pincodeInput.value = pincode;
}

function setupPaymentMethodToggles() {
  const codCard = document.getElementById('payment-cod-card');
  const upiCard = document.getElementById('payment-upi-card');
  const codRadio = document.getElementById('radio-payment-cod');
  const upiRadio = document.getElementById('radio-payment-upi');
  const upiBox = document.getElementById('upi-details-box');

  function updatePayment(method) {
    selectedPaymentMethod = method;
    if (method === 'cod') {
      codCard.classList.add('selected');
      upiCard.classList.remove('selected');
      codRadio.checked = true;
      if (upiBox) upiBox.style.display = 'none';
    } else {
      upiCard.classList.add('selected');
      codCard.classList.remove('selected');
      upiRadio.checked = true;
      if (upiBox) upiBox.style.display = 'flex';
    }
  }

  if (codCard) codCard.addEventListener('click', () => updatePayment('cod'));
  if (upiCard) upiCard.addEventListener('click', () => updatePayment('upi'));
}

function setupFormSubmit() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('checkout-name');
    const phoneInput = document.getElementById('checkout-phone');
    const addressInput = document.getElementById('checkout-address');
    const landmarkInput = document.getElementById('checkout-landmark');
    const pincodeInput = document.getElementById('checkout-pincode');
    const instructionsInput = document.getElementById('checkout-instructions');
    const placeBtn = document.getElementById('btn-place-order');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const landmark = landmarkInput ? landmarkInput.value.trim() : '';
    const pincode = pincodeInput ? pincodeInput.value.trim() : '';
    const instructions = instructionsInput ? instructionsInput.value.trim() : '';

    // Form Validations
    if (!name || name.length < 2) {
      showToast('Please enter your full name', 'error');
      nameInput.focus();
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/[^0-9]/g, '').slice(-10))) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      phoneInput.focus();
      return;
    }

    if (!address || address.length < 5) {
      showToast('Please provide your complete delivery address', 'error');
      addressInput.focus();
      return;
    }

    if (!pincode || pincode.length !== 6) {
      showToast('Please enter a valid 6-digit Bengaluru pincode', 'error');
      pincodeInput.focus();
      return;
    }

    try {
      if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.innerHTML = '<span>Processing your order...</span>';
      }

      const checkoutPayload = {
        customer_name: name,
        mobile_number: phone,
        delivery_address: address,
        landmark: landmark,
        pincode: pincode,
        locality: selectedLocality,
        payment_method: selectedPaymentMethod,
        coupon_code: window.currentCart.coupon_code || null,
        delivery_instructions: instructions
      };

      const orderResponse = await api.checkout(checkoutPayload);

      showToast('Order placed successfully! Redirecting...', 'success');
      // Redirect to Order Success Page
      setTimeout(() => {
        window.location.href = `/order-success?order_id=${encodeURIComponent(orderResponse.order_id)}`;
      }, 700);
    } catch (err) {
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
      if (placeBtn) {
        placeBtn.disabled = false;
        placeBtn.innerHTML = `<span>Place Order • ₹${Math.round(window.currentCart.grand_total)}</span>`;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initCheckoutPage);
