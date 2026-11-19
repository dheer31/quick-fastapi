/**
 * QuickKart API Client
 * Centralized communication layer with FastAPI backend.
 */

// Generate or retrieve persistent session ID
function getSessionId() {
  let sid = localStorage.getItem('quickkart_session_id');
  if (!sid) {
    sid = 'qk-sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('quickkart_session_id', sid);
  }
  return sid;
}

const API_BASE = ''; // Same-origin FastAPI server

const api = {
  sessionId: getSessionId(),

  /**
   * Helper fetch with standard JSON headers & session ID
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-ID': this.sessionId,
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) errMessage = errData.detail;
        } catch (_) {}
        throw new Error(errMessage);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // ==================== PRODUCTS ====================
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.collection) query.append('collection', params.collection);
    if (params.sort) query.append('sort', params.sort);
    if (params.discount) query.append('discount', 'true');
    if (params.in_stock_only) query.append('in_stock_only', 'true');
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    const qs = query.toString();
    return this.request(`/api/products${qs ? '?' + qs : ''}`);
  },

  async getProduct(productId) {
    return this.request(`/api/products/${encodeURIComponent(productId)}`);
  },

  // ==================== CATEGORIES ====================
  async getCategories() {
    return this.request('/api/categories');
  },

  async getCategoryProducts(categoryId) {
    return this.request(`/api/categories/${encodeURIComponent(categoryId)}/products`);
  },

  // ==================== SEARCH ====================
  async searchProducts(query, limit = 30) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  async getSearchSuggestions(query) {
    return this.request(`/api/search/suggestions?q=${encodeURIComponent(query || '')}`);
  },

  // ==================== CART ====================
  async getCart() {
    return this.request(`/api/cart?session_id=${this.sessionId}`);
  },

  async addToCart(productId, quantity = 1) {
    return this.request('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });
  },

  async updateCartItem(productId, quantity) {
    return this.request(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  async removeFromCart(productId) {
    return this.request(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    });
  },

  async clearCart() {
    return this.request('/api/cart', {
      method: 'DELETE'
    });
  },

  // ==================== COUPONS & CHECKOUT ====================
  async validateCoupon(code, subtotal) {
    return this.request('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  },

  async checkout(orderData) {
    return this.request('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ ...orderData, session_id: this.sessionId })
    });
  },

  // ==================== ORDERS & TRACKING ====================
  async getOrders() {
    return this.request(`/api/orders?session_id=${this.sessionId}`);
  },

  async getOrder(orderId) {
    return this.request(`/api/orders/${encodeURIComponent(orderId)}`);
  },

  async updateOrderStatus(orderId, status = null) {
    return this.request(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(status ? { status } : {})
    });
  },

  async resetOrderStatus(orderId) {
    return this.request(`/api/orders/${encodeURIComponent(orderId)}/reset`, {
      method: 'POST'
    });
  }
};
