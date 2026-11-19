/**
 * QuickKart Order Tracking Controller
 * Manages 5-stage visual progress stepper, live route illustration,
 * and demo simulation tools to step/auto-play status changes.
 */

let currentOrderId = '';
let currentOrder = null;
let autoSimInterval = null;

const STATUS_STAGES = [
  { name: "Order Placed", icon: "📝", desc: "Order received and queued at nearest dark store." },
  { name: "Order Confirmed", icon: "✅", desc: "Store confirmed items. Inventory reserved." },
  { name: "Packing", icon: "📦", desc: "Picker is bagging fresh products with care." },
  { name: "Out for Delivery", icon: "🛵", desc: "Rider is speeding through traffic with your delivery!" },
  { name: "Delivered", icon: "🎉", desc: "Order delivered safely at your doorstep." }
];

async function initTrackingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  currentOrderId = urlParams.get('order_id');

  if (!currentOrderId) {
    // If no order ID in query param, check recent orders from backend
    try {
      const orders = await api.getOrders();
      if (orders && orders.length > 0) {
        currentOrderId = orders[0].order_id;
      } else {
        currentOrderId = "QK-2026-DEMO1";
      }
    } catch (_) {
      currentOrderId = "QK-2026-DEMO1";
    }
  }

  await loadAndRenderOrder();
}

async function loadAndRenderOrder() {
  const layout = document.getElementById('tracking-container');
  if (!layout) return;

  try {
    currentOrder = await api.getOrder(currentOrderId);
    renderTrackingUI();
  } catch (err) {
    console.error('Order load error:', err);
    layout.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; margin: 40px auto; max-width: 600px;">
        <div class="empty-state-icon">⚠️</div>
        <h2 class="empty-state-title">Order #${currentOrderId} Not Found</h2>
        <p class="empty-state-sub">The order may have expired because the backend server restarted.</p>
        <a href="/products" class="btn-primary" style="display:inline-flex;">Browse Groceries</a>
      </div>
    `;
  }
}

function renderTrackingUI() {
  const layout = document.getElementById('tracking-container');
  if (!layout || !currentOrder) return;

  const o = currentOrder;
  const currentIdx = o.status_index || 0;
  const isDelivered = o.status === 'Delivered';

  // Calculate simulated rider position on map (15% to 85%)
  const riderPositions = ["18%", "32%", "50%", "72%", "85%"];
  const riderPos = riderPositions[currentIdx] || "50%";

  layout.innerHTML = `
    <!-- Left Column: Status & Simulation -->
    <div class="tracking-main">
      <!-- Live Status Header Banner -->
      <div class="tracking-header-card">
        <div>
          <div class="tracking-eta-lead">Delivery Status • ${o.order_id}</div>
          <div class="tracking-eta-time">${isDelivered ? 'Delivered 🎉' : (currentIdx >= 3 ? 'Arriving in 6 mins' : '10-15 Minutes')}</div>
          <div class="tracking-current-status-desc">${o.status_history[o.status_history.length - 1]?.description || 'Processing order...'}</div>
        </div>
        <div class="tracking-rider-chip">
          <div class="rider-avatar">🛵</div>
          <div class="rider-info">
            <div class="rider-name">${o.rider_name}</div>
            <div class="rider-vehicle">${o.rider_vehicle}</div>
            <div style="font-size:11px;color:#d5ffd5;margin-top:2px;">⭐ 4.9 Top Rated Partner</div>
          </div>
        </div>
      </div>

      <!-- Live Route Visualizer Graphic -->
      <div class="route-visualizer-card">
        <div class="route-header">Live Delivery Tracker</div>
        <div class="map-placeholder-box">
          <div class="map-path-line"></div>
          
          <!-- Store Point -->
          <div class="map-point-store">
            <div style="font-size:24px;">🏬</div>
            <span class="point-label">Dark Store (${o.locality})</span>
          </div>

          <!-- Moving Delivery Rider -->
          <div class="map-point-rider" style="left: ${riderPos};">
            <div style="font-size:26px; transform: scaleX(-1);">🛵</div>
            <span class="point-label" style="background:var(--primary-yellow);font-weight:800;">${o.rider_name.split(' ')[0]}</span>
          </div>

          <!-- Customer Destination -->
          <div class="map-point-customer">
            <div style="font-size:24px;">🏠</div>
            <span class="point-label">Your Location</span>
          </div>
        </div>
      </div>

      <!-- Visual Progress Stepper (5 Stages) -->
      <div class="progress-stepper-card">
        <h3 style="font-size:16px;font-weight:800;margin-bottom:20px;">Order Milestones</h3>
        <div class="stepper-list">
          ${STATUS_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const historyItem = o.status_history.find(h => h.status === stage.name);
            const timeText = historyItem ? historyItem.time : '';

            let itemClass = '';
            if (isCompleted) itemClass = 'completed';
            else if (isActive) itemClass = 'active';

            return `
              <div class="step-item ${itemClass}">
                <div class="step-indicator-wrap">
                  <div class="step-bullet">${isCompleted ? '✓' : stage.icon}</div>
                  ${idx < STATUS_STAGES.length - 1 ? '<div class="step-connector-line"></div>' : ''}
                </div>
                <div class="step-content">
                  <div class="step-title">${stage.name}</div>
                  <div class="step-desc">${stage.desc}</div>
                  ${timeText ? `<div class="step-time">🕒 ${timeText}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Demo Simulation Controller Box -->
      <div class="demo-simulation-card">
        <div class="sim-header">
          <div class="sim-title">
            <span>⚙️ Quick-Commerce Demo Controller</span>
          </div>
          <span class="sim-badge">INTERACTIVE DEMO</span>
        </div>
        <p class="sim-desc">
          Test the complete order lifecycle! Click <strong>Advance Status</strong> to progress through the 5 order phases in real-time via the FastAPI backend, or use <strong>Auto-Play</strong> to watch the live simulation.
        </p>
        <div class="sim-buttons-row">
          <button class="btn-sim-step" onclick="handleAdvanceOrderStatus()" ${isDelivered ? 'disabled style="opacity:0.6;"' : ''}>
            <span>Advance to Next Status ➔</span>
          </button>
          <button class="btn-sim-auto" id="btn-auto-sim" onclick="toggleAutoSimulation()">
            <span>${autoSimInterval ? '⏸️ Stop Auto-Play' : '▶️ Auto-Play Simulation'}</span>
          </button>
          <button class="btn-sim-reset" onclick="handleResetOrderStatus()">
            <span>🔄 Reset to Order Placed</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Order Details Receipt -->
    <div class="tracking-sidebar">
      <div class="bill-details-card">
        <div class="bill-title">Delivery Details</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;line-height:1.4;">
          <div style="font-weight:700;color:var(--text-primary);">${o.customer_name}</div>
          <div>📞 ${o.mobile_number}</div>
          <div style="margin-top:4px;">📍 ${o.delivery_address}</div>
          ${o.landmark ? `<div>Landmark: ${o.landmark}</div>` : ''}
          <div>Pincode: ${o.pincode} (${o.locality})</div>
          <div style="margin-top:4px;font-style:italic;color:#777;">Note: "${o.delivery_instructions}"</div>
        </div>

        <div class="bill-title" style="padding-top:14px;border-top:1px solid #eee;">Payment Info</div>
        <div class="bill-row">
          <span>Payment Method</span>
          <span style="font-weight:700;color:var(--text-primary);">${o.payment_method}</span>
        </div>
        <div class="bill-row">
          <span>Payment Status</span>
          <span style="font-weight:700;color:var(--primary-green);">Paid / Verified</span>
        </div>

        <div class="bill-title" style="padding-top:14px;border-top:1px solid #eee;">Items Ordered (${o.items.length})</div>
        <div style="max-height:220px;overflow-y:auto;margin-bottom:14px;padding-right:4px;">
          ${o.items.map(i => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f4f4f4;font-size:13px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="${i.image_url}" alt="${i.name}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;background:#f9f9f9;">
                <div>
                  <div style="font-weight:600;color:var(--text-primary);">${i.name}</div>
                  <div style="font-size:11px;color:var(--text-secondary);">${i.weight} × ${i.quantity}</div>
                </div>
              </div>
              <div style="font-weight:700;">₹${Math.round(i.item_total)}</div>
            </div>
          `).join('')}
        </div>

        <div class="bill-row">
          <span>Items Total</span>
          <span>₹${Math.round(o.subtotal)}</span>
        </div>
        <div class="bill-row">
          <span>Delivery Charge</span>
          <span>${o.delivery_charge === 0 ? `<span style="color:var(--primary-green);font-weight:700;">FREE</span>` : `₹${Math.round(o.delivery_charge)}`}</span>
        </div>
        <div class="bill-row">
          <span>Handling Charge</span>
          <span>₹${Math.round(o.handling_charge)}</span>
        </div>
        ${o.discount > 0 ? `
          <div class="bill-row discount-row">
            <span>Coupon Discount</span>
            <span>-₹${Math.round(o.discount)}</span>
          </div>
        ` : ''}
        <div class="bill-row total-row">
          <span>Total Paid</span>
          <span>₹${Math.round(o.grand_total)}</span>
        </div>

        <div style="margin-top:20px;text-align:center;">
          <a href="/products" class="btn-secondary" style="width:100%;display:inline-flex;justify-content:center;">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;
}

async function handleAdvanceOrderStatus() {
  try {
    const updated = await api.updateOrderStatus(currentOrderId);
    currentOrder = updated;
    renderTrackingUI();
    showToast(`Order status updated: ${updated.status}!`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update order status', 'error');
  }
}

async function handleResetOrderStatus() {
  try {
    if (autoSimInterval) toggleAutoSimulation();
    const reset = await api.resetOrderStatus(currentOrderId);
    currentOrder = reset;
    renderTrackingUI();
    showToast('Order status reset to Order Placed', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to reset order', 'error');
  }
}

function toggleAutoSimulation() {
  const btn = document.getElementById('btn-auto-sim');
  if (autoSimInterval) {
    clearInterval(autoSimInterval);
    autoSimInterval = null;
    if (btn) btn.innerHTML = '<span>▶️ Auto-Play Simulation</span>';
    showToast('Simulation paused', 'info');
  } else {
    showToast('Starting auto simulation (every 4s)...', 'success');
    if (btn) btn.innerHTML = '<span>⏸️ Stop Auto-Play</span>';
    autoSimInterval = setInterval(async () => {
      if (currentOrder && currentOrder.status === 'Delivered') {
        clearInterval(autoSimInterval);
        autoSimInterval = null;
        if (btn) btn.innerHTML = '<span>▶️ Auto-Play Simulation</span>';
        showToast('Order reached final stage (Delivered)!', 'success');
        return;
      }
      await handleAdvanceOrderStatus();
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', initTrackingPage);
