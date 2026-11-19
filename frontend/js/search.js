/**
 * QuickKart Search Engine
 * Handles live search input, suggestions, popular searches, and navigation.
 */

let searchDebounceTimer = null;

function initSearch() {
  const searchInput = document.getElementById('main-search-input');
  const searchDropdown = document.getElementById('search-dropdown');
  const clearBtn = document.getElementById('search-clear-btn');

  if (!searchInput || !searchDropdown) return;

  // Focus event: show popular searches if input is empty
  searchInput.addEventListener('focus', async () => {
    if (!searchInput.value.trim()) {
      await showPopularSearches();
    } else {
      await performLiveSearch(searchInput.value.trim());
    }
  });

  // Input event with 250ms debounce
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    if (clearBtn) {
      if (val) clearBtn.classList.add('active');
      else clearBtn.classList.remove('active');
    }

    clearTimeout(searchDebounceTimer);
    if (!val) {
      showPopularSearches();
      return;
    }

    searchDebounceTimer = setTimeout(() => {
      performLiveSearch(val);
    }, 250);
  });

  // Enter key navigation
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = searchInput.value.trim();
      if (val) {
        window.location.href = `/products?search=${encodeURIComponent(val)}`;
      }
    }
  });

  // Clear button click
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('active');
      showPopularSearches();
      searchInput.focus();
    });
  }

  // Click outside to close dropdown
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchDropdown.classList.remove('open');
    }
  });
}

async function showPopularSearches() {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;

  try {
    const res = await api.getSearchSuggestions('');
    const popular = res.popular_searches || [
      "Amul Milk", "Tomato", "Potato Chips", "Atta", "Coca Cola", "Butter", "Paneer", "Maggi Noodles"
    ];

    dropdown.innerHTML = `
      <div class="search-dropdown-section-title">🔥 Popular Searches</div>
      <div class="popular-chips-wrap">
        ${popular.map(term => `
          <div class="popular-chip" onclick="handleSearchTermClick('${term}')">${term}</div>
        `).join('')}
      </div>
      <div class="search-dropdown-section-title" style="margin-top:14px;">⚡ Popular Categories</div>
      <div class="popular-chips-wrap">
        <div class="popular-chip" onclick="window.location.href='/products?category=vegetables-fruits'">🥦 Fruits & Vegetables</div>
        <div class="popular-chip" onclick="window.location.href='/products?category=dairy-bread-eggs'">🥛 Dairy & Bread</div>
        <div class="popular-chip" onclick="window.location.href='/products?category=snacks-munchies'">🍿 Snacks & Munchies</div>
        <div class="popular-chip" onclick="window.location.href='/products?category=cold-drinks-juices'">🥤 Drinks & Juices</div>
      </div>
    `;
    dropdown.classList.add('open');
  } catch (err) {
    console.error('Failed to load popular searches:', err);
  }
}

async function performLiveSearch(term) {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;

  try {
    const [suggestionsRes, searchResults] = await Promise.all([
      api.getSearchSuggestions(term),
      api.searchProducts(term, 6)
    ]);

    const suggestions = suggestionsRes.suggestions || [];

    if (searchResults.length === 0 && suggestions.length === 0) {
      dropdown.innerHTML = `
        <div class="search-no-results">
          <div style="font-size:32px;margin-bottom:8px;">🔍</div>
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">No products found for "${term}"</div>
          <div style="font-size:12px;color:var(--text-secondary);">Try searching for milk, bread, chips, atta, or vegetables</div>
        </div>
      `;
      dropdown.classList.add('open');
      return;
    }

    let html = '';

    if (searchResults.length > 0) {
      html += `
        <div class="search-dropdown-section-title">Products</div>
        ${searchResults.map(p => `
          <div class="suggestion-item" onclick="openProductDetailModal('${p.id}')">
            <div class="suggestion-left">
              <img src="${p.image_url}" alt="${p.name}" style="width:34px;height:34px;object-fit:contain;border-radius:4px;background:#f9f9f9;">
              <div>
                <div class="suggestion-text">${p.name}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${p.weight}</div>
              </div>
            </div>
            <div class="suggestion-price">₹${Math.round(p.price)}</div>
          </div>
        `).join('')}
      `;
    }

    if (suggestions.length > 0) {
      html += `
        <div class="search-dropdown-section-title" style="margin-top:12px;">Related Keywords</div>
        <div class="popular-chips-wrap">
          ${suggestions.map(s => `
            <div class="popular-chip" onclick="handleSearchTermClick('${s.text}')">${s.text}</div>
          `).join('')}
        </div>
      `;
    }

    html += `
      <div style="text-align:center;padding-top:12px;border-top:1px solid var(--border);margin-top:12px;">
        <button class="section-see-all" onclick="window.location.href='/products?search=${encodeURIComponent(term)}'">
          See all results for "${term}" →
        </button>
      </div>
    `;

    dropdown.innerHTML = html;
    dropdown.classList.add('open');
  } catch (err) {
    console.error('Search error:', err);
  }
}

function handleSearchTermClick(term) {
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) searchInput.value = term;
  window.location.href = `/products?search=${encodeURIComponent(term)}`;
}

document.addEventListener('DOMContentLoaded', initSearch);
