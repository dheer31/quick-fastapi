/**
 * QuickKart Homepage Controller
 * Manages hero banner rotator, categories strip, and 10 product collection carousels.
 */

// Hero Banner Data
const HERO_BANNERS = [
  {
    tag: "⚡ Lightning Fast",
    title: "Groceries delivered in 10 minutes",
    subtitle: "Get fresh farm veggies, dairy, snacks & kitchen essentials at your doorstep.",
    buttonText: "Shop Daily Needs",
    link: "/products?category=dairy-bread-eggs",
    class: "hero-slide-1",
    img: "/static/assets/images/hero-1.svg"
  },
  {
    tag: "🥬 Farm Fresh Daily",
    title: "Fresh Fruits & Crisp Vegetables",
    subtitle: "Directly harvested from local Karnataka farms. Washed, sorted & chemical free.",
    buttonText: "Explore Fresh Produce",
    link: "/products?category=vegetables-fruits",
    class: "hero-slide-2",
    img: "/static/assets/images/hero-2.svg"
  },
  {
    tag: "🍿 Craving Station",
    title: "Snacks, Munchies & Chilled Sodas",
    subtitle: "Binge-worthy chips, chocolates, instant noodles, and ice-cold soft drinks.",
    buttonText: "Satisfy Cravings",
    link: "/products?category=snacks-munchies",
    class: "hero-slide-3",
    img: "/static/assets/images/hero-3.svg"
  },
  {
    tag: "🏷️ Mega Savings",
    title: "Kitchen Staples & Monthly Atta, Dal",
    subtitle: "Use code WELCOME10 for 10% OFF on your first grocery basket above ₹100.",
    buttonText: "Save on Essentials",
    link: "/products?category=atta-rice-dal",
    class: "hero-slide-4",
    img: "/static/assets/images/hero-4.svg"
  }
];

// Product Collections Mapping
const COLLECTIONS_CONFIG = [
  {
    id: "bestsellers",
    title: "Bestseller Products",
    collectionName: "Bestseller Products",
    filterParam: "collection=Bestseller Products",
    categorySlug: null
  },
  {
    id: "fresh-veggies",
    title: "Fresh Vegetables",
    collectionName: "Fresh Vegetables",
    filterParam: "category=vegetables-fruits",
    categorySlug: "vegetables-fruits"
  },
  {
    id: "fresh-fruits",
    title: "Fresh Fruits",
    collectionName: "Fresh Fruits",
    filterParam: "category=vegetables-fruits",
    categorySlug: "vegetables-fruits"
  },
  {
    id: "dairy-breakfast",
    title: "Dairy & Breakfast",
    collectionName: "Dairy & Breakfast",
    filterParam: "category=dairy-bread-eggs",
    categorySlug: "dairy-bread-eggs"
  },
  {
    id: "snacks-munchies",
    title: "Snacks & Munchies",
    collectionName: "Snacks & Munchies",
    filterParam: "category=snacks-munchies",
    categorySlug: "snacks-munchies"
  },
  {
    id: "cold-drinks",
    title: "Cold Drinks & Juices",
    collectionName: "Cold Drinks & Juices",
    filterParam: "category=cold-drinks-juices",
    categorySlug: "cold-drinks-juices"
  },
  {
    id: "instant-food",
    title: "Instant Food",
    collectionName: "Instant Food",
    filterParam: "category=instant-food",
    categorySlug: "instant-food"
  },
  {
    id: "grocery-kitchen",
    title: "Grocery & Kitchen",
    collectionName: "Grocery & Kitchen",
    filterParam: "category=atta-rice-dal",
    categorySlug: "atta-rice-dal"
  },
  {
    id: "personal-care",
    title: "Personal Care",
    collectionName: "Personal Care",
    filterParam: "category=personal-care",
    categorySlug: "personal-care"
  },
  {
    id: "household-essentials",
    title: "Household Essentials",
    collectionName: "Household Essentials",
    filterParam: "category=cleaning-essentials",
    categorySlug: "cleaning-essentials"
  }
];

let heroSlideIndex = 0;
let heroSlideInterval = null;

function initHeroCarousel() {
  const track = document.getElementById('hero-carousel-track');
  const dotsContainer = document.getElementById('hero-carousel-dots');
  if (!track || !dotsContainer) return;

  // Render slides
  track.innerHTML = HERO_BANNERS.map((banner, idx) => `
    <div class="hero-slide ${banner.class}">
      <div class="hero-content">
        <span class="hero-tag">${banner.tag}</span>
        <h1 class="hero-title">${banner.title}</h1>
        <p class="hero-subtitle">${banner.subtitle}</p>
        <a href="${banner.link}" class="hero-btn">${banner.buttonText} →</a>
      </div>
      <div class="hero-image-wrap">
        <img class="hero-img" src="${banner.img}" alt="${banner.title}">
      </div>
    </div>
  `).join('');

  // Render dots
  dotsContainer.innerHTML = HERO_BANNERS.map((_, idx) => `
    <div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="goToHeroSlide(${idx})"></div>
  `).join('');

  startHeroAutoSlide();

  // Pause on hover
  const container = document.querySelector('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', () => clearInterval(heroSlideInterval));
    container.addEventListener('mouseleave', () => startHeroAutoSlide());
  }
}

function startHeroAutoSlide() {
  clearInterval(heroSlideInterval);
  heroSlideInterval = setInterval(() => {
    heroSlideIndex = (heroSlideIndex + 1) % HERO_BANNERS.length;
    updateHeroSlidePosition();
  }, 4500);
}

function goToHeroSlide(idx) {
  heroSlideIndex = idx;
  updateHeroSlidePosition();
}

function prevHeroSlide() {
  heroSlideIndex = (heroSlideIndex - 1 + HERO_BANNERS.length) % HERO_BANNERS.length;
  updateHeroSlidePosition();
}

function nextHeroSlide() {
  heroSlideIndex = (heroSlideIndex + 1) % HERO_BANNERS.length;
  updateHeroSlidePosition();
}

function updateHeroSlidePosition() {
  const track = document.getElementById('hero-carousel-track');
  const dots = document.querySelectorAll('.carousel-dot');
  if (track) {
    track.style.transform = `translateX(-${heroSlideIndex * 100}%)`;
  }
  dots.forEach((dot, idx) => {
    if (idx === heroSlideIndex) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}

// ==================== CATEGORIES STRIP ====================
async function loadCategoriesStrip() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  try {
    const categories = await api.getCategories();
    grid.innerHTML = categories.map(cat => `
      <div class="category-card" onclick="window.location.href='/products?category=${cat.id}'">
        <div class="category-img-box">
          <img class="category-img" src="${cat.image}" alt="${cat.name}" loading="lazy">
        </div>
        <div class="category-name">${cat.name}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load categories:', err);
    grid.innerHTML = `<div style="padding:20px;color:#888;">Unable to load categories.</div>`;
  }
}

// ==================== PRODUCT COLLECTIONS ====================
async function loadProductCollections() {
  const container = document.getElementById('collections-container');
  if (!container) return;

  try {
    // Fetch all products from FastAPI
    const res = await api.getProducts({ limit: 100 });
    const allProducts = res.products || [];

    let html = '';

    COLLECTIONS_CONFIG.forEach(coll => {
      let filtered = [];

      if (coll.id === 'bestsellers') {
        filtered = allProducts.filter(p => p.is_bestseller);
      } else if (coll.id === 'fresh-veggies') {
        filtered = allProducts.filter(p => p.collection === 'Fresh Vegetables');
      } else if (coll.id === 'fresh-fruits') {
        filtered = allProducts.filter(p => p.collection === 'Fresh Fruits');
      } else if (coll.collectionName) {
        filtered = allProducts.filter(p => p.collection === coll.collectionName);
      }

      // If fewer than 4 items, backfill from category if slug exists
      if (filtered.length < 4 && coll.categorySlug) {
        const catItems = allProducts.filter(p => p.category_id === coll.categorySlug);
        filtered = [...filtered, ...catItems.filter(ci => !filtered.some(f => f.id === ci.id))];
      }

      if (filtered.length === 0) return;

      html += `
        <section class="product-collection-section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">${coll.title}</h2>
              <a href="/products?${coll.filterParam}" class="section-see-all">See All →</a>
            </div>
            <div class="collection-carousel-wrapper">
              <button class="scroll-ctrl-btn scroll-ctrl-prev" onclick="scrollCollectionTrack('${coll.id}', -1)" aria-label="Previous">❮</button>
              <div class="product-carousel-track" id="track-${coll.id}">
                ${filtered.map(p => createProductCardHTML(p)).join('')}
              </div>
              <button class="scroll-ctrl-btn scroll-ctrl-next" onclick="scrollCollectionTrack('${coll.id}', 1)" aria-label="Next">❯</button>
            </div>
          </div>
        </section>
      `;
    });

    container.innerHTML = html;
    updateAllProductCardButtons();
  } catch (err) {
    console.error('Failed to load collections:', err);
    container.innerHTML = `<div class="container" style="padding:40px 0;text-align:center;color:#888;">Error loading product collections.</div>`;
  }
}

function scrollCollectionTrack(collId, direction) {
  const track = document.getElementById(`track-${collId}`);
  if (track) {
    const scrollAmount = 480 * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  loadCategoriesStrip();
  loadProductCollections();
});
