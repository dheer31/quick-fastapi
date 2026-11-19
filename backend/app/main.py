import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .routers import products, categories, search, cart, checkout, orders
from .services import order_service
from .schemas.order import CheckoutRequest
from .services import cart_service

app = FastAPI(
    title="QuickKart API",
    description="High-fidelity quick-commerce platform inspired by Blinkit. Ultra-fast in-memory grocery commerce.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(search.router)
app.include_router(cart.router)
app.include_router(checkout.router)
app.include_router(orders.router)

# Resolve Frontend Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

if not FRONTEND_DIR.exists():
    # Fallback to local frontend directory
    FRONTEND_DIR = Path("frontend").resolve()

# Mount static directories
# 1. Mount /static to serve frontend static directory
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
    
    # Also mount subdirectories directly so relative paths like "css/style.css" or "/css/style.css" work seamlessly
    css_dir = FRONTEND_DIR / "css"
    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    js_dir = FRONTEND_DIR / "js"
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# Frontend HTML Page Routes
@app.get("/", summary="Homepage")
def serve_home():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/index.html")
def serve_index_html():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/products", summary="Product Listing Page")
def serve_products():
    return FileResponse(FRONTEND_DIR / "products.html")

@app.get("/products.html")
def serve_products_html():
    return FileResponse(FRONTEND_DIR / "products.html")

@app.get("/cart", summary="Cart Page")
def serve_cart():
    return FileResponse(FRONTEND_DIR / "cart.html")

@app.get("/cart.html")
def serve_cart_html():
    return FileResponse(FRONTEND_DIR / "cart.html")

@app.get("/checkout", summary="Checkout Page")
def serve_checkout():
    return FileResponse(FRONTEND_DIR / "checkout.html")

@app.get("/checkout.html")
def serve_checkout_html():
    return FileResponse(FRONTEND_DIR / "checkout.html")

@app.get("/order-success", summary="Order Success Page")
def serve_order_success():
    return FileResponse(FRONTEND_DIR / "order-success.html")

@app.get("/order-success.html")
def serve_order_success_html():
    return FileResponse(FRONTEND_DIR / "order-success.html")

@app.get("/tracking", summary="Order Tracking Page")
def serve_tracking():
    return FileResponse(FRONTEND_DIR / "tracking.html")

@app.get("/tracking.html")
def serve_tracking_html():
    return FileResponse(FRONTEND_DIR / "tracking.html")

@app.on_event("startup")
def seed_demo_data():
    """
    Seed initial demo order for instant demo simulation on startup.
    """
    try:
        # Pre-populate demo cart with a couple popular items
        cart_service.add_to_cart("demo-session", "prod_1", 2)  # Amul Milk
        cart_service.add_to_cart("demo-session", "prod_8", 1)  # Tomatoes
        cart_service.add_to_cart("demo-session", "prod_21", 2) # Lays
        
        # Create an initial demo order so tracking works immediately out of the box
        demo_checkout = CheckoutRequest(
            session_id="initial-demo",
            customer_name="Aditi Sharma",
            mobile_number="9876543210",
            delivery_address="Flat 402, Green Glen Layout, Outer Ring Road",
            landmark="Near Bellandur Flyover",
            pincode="560103",
            locality="Koramangala",
            payment_method="upi",
            coupon_code="WELCOME10",
            delivery_instructions="Leave with security"
        )
        cart_service.add_to_cart("initial-demo", "prod_1", 2)
        cart_service.add_to_cart("initial-demo", "prod_4", 1)
        cart_service.add_to_cart("initial-demo", "prod_15", 1)
        cart_service.add_to_cart("initial-demo", "prod_27", 2)
        demo_order = order_service.create_order(demo_checkout)
        demo_order["order_id"] = "QK-2026-DEMO1"
        order_service.ORDERS["QK-2026-DEMO1"] = demo_order
        print("QuickKart backend initialized with demo order QK-2026-DEMO1")
    except Exception as e:
        print(f"Startup seed notice: {e}")
