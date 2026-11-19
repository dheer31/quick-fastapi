# QuickKart - High-Fidelity Quick-Commerce Platform

A production-grade, commercial quick-commerce grocery shopping platform inspired by **Blinkit**'s user experience and visual design language.

Built with a unified, lightweight modern stack: **Vanilla HTML5, CSS3, JavaScript (ES6+), and Python FastAPI**. All frontend pages, static assets, in-memory data store, and REST APIs are served through a single FastAPI application on port 8000.

---

## 📸 Key Design & Architecture Highlights

- **Blinkit-Inspired Visual Identity**:
  - Primary Yellow (`#F8CB46`), Blinkit Green (`#0C831F`), Clean White Cards (`#FFFFFF`), Subtle Borders (`#E8E8E8`), and Page Background (`#F5F5F5`).
  - Inter typography, high-contrast badges, compact product cards with 10-minute delivery badges, veg indicators, and MRP discount tags.
  - Interactive Blinkit-style `ADD` button that seamlessly transforms into a quantity stepper `[-] qty [+]`.
- **Pure In-Memory Architecture**:
  - No database required (no MySQL, SQLite, MongoDB, PostgreSQL, or Redis).
  - High-performance Python in-memory dictionaries and lists.
  - Cart state persists per session across browser refreshes and syncs with FastAPI endpoints.
- **Single-Server Deployment**:
  - Zero reverse proxy (No Nginx, No Apache).
  - Zero container overhead (No Docker, No Docker Compose).
  - FastAPI serves all static assets, HTML templates, and REST APIs directly.

---

## 🛒 Features Tour

### 1. Homepage (`/`)
- **Sticky Header**: QuickKart branding, 10–15 min Bengaluru delivery indicator, location selector modal, live search bar with auto-suggestions, cart counter pill and live subtotal preview.
- **Location Selector Modal**: Select demo Bengaluru localities: *Indiranagar, Koramangala, HSR Layout, Whitefield, Marathahalli, Electronic City, Jayanagar*.
- **Interactive Search Engine**: Live search suggestions as you type, popular search chips (*Amul Milk, Tomatoes, Potato Chips, Atta, etc.*), clear button, and no-results state.
- **Hero Promotional Banner Carousel**: 4 banners with smooth auto-scroll every 4.5 seconds, pause-on-hover, dots, and manual arrows.
- **Horizontally Scrollable Category Bar**: 12 core quick-commerce grocery categories with real imagery.
- **10 Product Collection Carousels**:
  1. Bestseller Products
  2. Fresh Vegetables
  3. Fresh Fruits
  4. Dairy & Breakfast
  5. Snacks & Munchies
  6. Cold Drinks & Juices
  7. Instant Food
  8. Grocery & Kitchen (Atta, Rice, Dal)
  9. Personal Care
  10. Household Essentials

### 2. Product Listing & Filter Page (`/products`)
- Category navigation sidebar with live product counts.
- Search keyword filter with instant matching.
- Sorting options: *Popularity & Rating, Price: Low to High, Price: High to Low, Biggest Discount*.
- Filter toggles: *In-Stock Only* and *Special Discounts & Offers*.
- Responsive product grid (2 columns on mobile, 4-5 columns on desktop).
- Product Details Modal: Nutritional info, weight, enlarged picture, Add to Cart.

### 3. Shopping Cart Drawer & Dedicated Cart Page (`/cart`)
- Slide-out cart drawer accessible from header on all pages, plus full `/cart` page.
- Itemized list with thumbnail, weight, price, stepper controls `[-] qty [+]`, and item delete button.
- **Free Delivery Progress Meter**: Dynamically calculates and displays progress towards the ₹199 free delivery threshold.
- **Coupon System**:
  - `WELCOME10`: 10% OFF on orders above ₹100
  - `FLAT50`: Flat ₹50 OFF on orders above ₹300
  - `FREESHIP`: Free delivery on any order
- Complete Bill Breakdown: Items Total, Handling Charge (₹2), Delivery Fee (₹15 / FREE), Coupon Savings, Grand Total, and Net Savings callout.

### 4. Demo Checkout (`/checkout`)
- Zero login or authentication required.
- Collects customer name, 10-digit mobile number, street address, landmark, 6-digit pincode, and delivery instructions.
- Locality chips for 1-click address completion.
- Payment modes:
  - **Cash on Delivery (COD)**
  - **Demo Instant UPI** (with simulated QR code and test ID `quickkart@demo`).
- Validates data on FastAPI backend, calculates final bills, generates a unique Order ID (`QK-2026-XXXXX`), clears cart, and redirects to Order Success.

### 5. Order Tracking & Lifecycle Simulator (`/tracking`)
- **5-Stage Order Progress Tracker**:
  1. *Order Placed*
  2. *Order Confirmed*
  3. *Packing*
  4. *Out for Delivery*
  5. *Delivered*
- **Live Delivery Partner Card**: Rider name (*Ramesh Kumar*), vehicle number (*KA-01-EQ-4421*), and star rating (*⭐ 4.9*).
- **Animated Route Map Visualizer**: Visual illustration of rider traveling from dark store to destination.
- **Interactive Demo Simulator**:
  - `Advance to Next Status`: Step forward through the 5 order phases in real-time.
  - `Auto-Play Simulation`: Auto-advances order stage every 4 seconds.
  - `Reset to Order Placed`: Reset lifecycle back to initial state for demonstration.

---

## 🛠️ Project Structure

```
Quickkart/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # Unified FastAPI application & routing
│   │   ├── data/
│   │   │   ├── categories.py           # 12 quick-commerce categories
│   │   │   ├── products.py             # 72+ authentic Indian grocery products
│   │   │   └── coupons.py              # WELCOME10, FLAT50, FREESHIP
│   │   ├── routers/
│   │   │   ├── products.py             # /api/products endpoints
│   │   │   ├── categories.py           # /api/categories endpoints
│   │   │   ├── search.py               # /api/search & /api/search/suggestions
│   │   │   ├── cart.py                 # /api/cart CRUD endpoints
│   │   │   ├── checkout.py             # /api/checkout & coupon validation
│   │   │   └── orders.py               # /api/orders & status update simulator
│   │   ├── schemas/
│   │   │   ├── product.py              # Pydantic schemas for products
│   │   │   ├── cart.py                 # Cart & coupon schemas
│   │   │   └── order.py                # Order & checkout schemas
│   │   └── services/
│   │       ├── cart_service.py         # Session-based in-memory cart logic
│   │       ├── order_service.py        # Order creation & simulation logic
│   │       └── pricing_service.py      # Calculations, discounts, fees
│   └── requirements.txt
├── frontend/
│   ├── index.html                      # Homepage
│   ├── products.html                   # Product listing & search page
│   ├── cart.html                       # Dedicated cart page
│   ├── checkout.html                   # Delivery address & payment page
│   ├── order-success.html              # Order confirmation page
│   ├── tracking.html                   # Visual order status & simulation
│   ├── css/
│   │   ├── style.css                   # Design tokens, buttons, modals, toasts
│   │   ├── header.css                  # Sticky header, location picker, search
│   │   ├── products.css                # Compact product cards & carousels
│   │   ├── cart.css                    # Cart drawer, bill details, coupons
│   │   ├── checkout.css                # Checkout forms & status stepper
│   │   └── responsive.css              # Desktop, laptop, tablet, mobile rules
│   └── js/
│       ├── api.js                      # Fetch API client for FastAPI
│       ├── app.js                      # Central state, cart sync, toasts
│       ├── home.js                     # Banner carousel & collections
│       ├── products.js                 # Filtering & sorting
│       ├── search.js                   # Live search dropdown
│       ├── cart.js                     # Cart calculations & coupons
│       ├── checkout.js                 # Checkout validation & submission
│       └── tracking.js                 # 5-stage stepper & simulation
├── deploy/
│   └── quickkart.service               # Systemd daemon configuration
├── run.py                              # Local startup script
├── requirements.txt
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python run.py
```
*Or directly via Uvicorn:*
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open in Browser
- **Website Homepage**: [http://localhost:8000](http://localhost:8000)
- **Product Listing**: [http://localhost:8000/products](http://localhost:8000/products)
- **Shopping Cart**: [http://localhost:8000/cart](http://localhost:8000/cart)
- **Live Order Tracking**: [http://localhost:8000/tracking](http://localhost:8000/tracking)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ☁️ AWS EC2 Deployment Guide (Without Nginx or Docker)

Deploy directly on a standard Ubuntu 22.04 / 24.04 LTS AWS EC2 instance without any reverse proxy or container runtime.

### Architectural Diagram

```
[ Browser / Client ]
         │
         │  HTTP Port 8000
         ▼
[ AWS EC2 Public IP ]
         │
         ▼
[ FastAPI + Uvicorn (Port 8000) ]
         ├── Static Files & HTML Pages (FileResponse & StaticFiles)
         ├── REST APIs (/api/...)
         └── Python In-Memory Data Store (Products, Carts, Orders)
```

---

### Step 1: Configure AWS Security Group
In the AWS EC2 Management Console, edit your instance's **Inbound Security Group Rules**:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| **SSH** | TCP | 22 | `My IP` (or `0.0.0.0/0`) | Secure SSH access |
| **Custom TCP** | TCP | 8000 | `0.0.0.0/0` (Anywhere IPv4) | Direct FastAPI web access |

> **Why Port 8000?**
> Since this architecture intentionally omits Nginx and Apache reverse proxies, Uvicorn binds directly to port 8000 on `0.0.0.0`. Opening port 8000 in your Security Group permits client web browsers to directly reach FastAPI without needing administrative port 80 bindings.

---

### Step 2: Connect to Ubuntu EC2 via SSH
```bash
ssh -i "your-key-pair.pem" ubuntu@<EC2-PUBLIC-IP>
```

---

### Step 3: Update Ubuntu Packages & Install Python 3
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git
```

---

### Step 4: Clone or Transfer Project Files to EC2
```bash
# Option A: Git Clone
git clone <your-repo-url> /home/ubuntu/Quickkart
cd /home/ubuntu/Quickkart

# Option B: SCP upload from your local machine
# scp -i "your-key.pem" -r Quickkart/ ubuntu@<EC2-PUBLIC-IP>:/home/ubuntu/
```

---

### Step 5: Create and Activate Virtual Environment
```bash
cd /home/ubuntu/Quickkart
python3 -m venv venv
source venv/bin/activate
```

---

### Step 6: Install Python Requirements
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 7: Test Direct Startup
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Open `http://<EC2-PUBLIC-IP>:8000` in your browser. Verify the homepage loads smoothly. Press `Ctrl + C` in the terminal to stop.

---

### Step 8: Configure systemd Background Service
To keep the application running continuously after SSH disconnection and auto-restart on reboot or crash:

1. Copy the systemd service file:
```bash
sudo cp deploy/quickkart.service /etc/systemd/system/quickkart.service
```

2. Reload systemd and enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable quickkart
sudo systemctl start quickkart
```

3. Verify service status:
```bash
sudo systemctl status quickkart
```

### Useful Management Commands:
- **Restart application**: `sudo systemctl restart quickkart`
- **Stop application**: `sudo systemctl stop quickkart`
- **View live streaming logs**: `sudo journalctl -u quickkart -f`

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | `GET` | Get products (supports `category`, `collection`, `sort`, `discount`, `in_stock_only`) |
| `/api/products/{id}` | `GET` | Get specific product details by ID |
| `/api/categories` | `GET` | Get 12 categories with dynamic product count |
| `/api/categories/{id}/products` | `GET` | Get all products for a category |
| `/api/search` | `GET` | Search products by name, category, or description |
| `/api/search/suggestions` | `GET` | Popular searches and live query auto-completions |
| `/api/cart` | `GET` | Retrieve session cart, calculations, and discounts |
| `/api/cart/items` | `POST` | Add item to cart |
| `/api/cart/items/{id}` | `PUT` | Update item quantity in cart |
| `/api/cart/items/{id}` | `DELETE` | Remove single item from cart |
| `/api/cart` | `DELETE` | Clear all items from cart |
| `/api/coupons/validate` | `POST` | Validate promo code against cart subtotal |
| `/api/checkout` | `POST` | Place order, compute final bill, return Order ID |
| `/api/orders` | `GET` | List orders for current demo session |
| `/api/orders/{id}` | `GET` | Retrieve order details & tracking status |
| `/api/orders/{id}/status` | `PATCH` | Advance or set demo order milestone status |
| `/api/orders/{id}/reset` | `POST` | Reset order status to 'Order Placed' for demo |


## Local product images and image troubleshooting

QuickKart now includes 89 self-hosted SVG image assets in `frontend/assets/images/`.
Product, category, and hero artwork is served by FastAPI from `/static/assets/images/`.
The storefront no longer relies on Unsplash or another third-party image host for its
product photography/artwork, so blocked external image hosts will not leave blank cards.
A global image error handler swaps any unexpected broken image to `image-fallback.svg`.

### Run locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python run.py
```

Open `http://127.0.0.1:8000` in your browser. API docs are at
`http://127.0.0.1:8000/docs`.

### Run verification

```bash
python verify_all.py
python -m unittest discover -s tests -v
```

If you change product or category image paths, keep the corresponding files inside
`frontend/assets/images/` and rerun the tests.
