"""
Direct Functional Verification for QuickKart.
"""
import sys
import os

# Unbuffered print
def log(msg):
    print(msg, flush=True)

log("Starting direct component checks...")

# 1. Check data models and imports
from backend.app.data.products import PRODUCTS
from backend.app.data.categories import CATEGORIES
from backend.app.data.coupons import COUPONS
log(f"[OK] Products loaded: {len(PRODUCTS)}")
log(f"[OK] Categories loaded: {len(CATEGORIES)}")
log(f"[OK] Coupons loaded: {list(COUPONS.keys())}")

# 2. Check Pricing service
from backend.app.services.pricing_service import validate_coupon, calculate_totals
c_res = validate_coupon("WELCOME10", 300)
assert c_res["valid"] is True and c_res["discount"] == 30.0
log(f"[OK] Pricing validation: WELCOME10 discount is ₹{c_res['discount']}")

totals = calculate_totals([{"price": 100, "original_price": 120, "quantity": 2}], "WELCOME10")
log(f"[OK] Pricing totals: subtotal={totals['subtotal']}, grand_total={totals['grand_total']}, savings={totals['total_savings']}")

# 3. Check Cart service
from backend.app.services.cart_service import add_to_cart, update_cart_item, remove_from_cart, clear_cart, get_cart_response
session_id = "test-direct-session"
clear_cart(session_id)
c1 = add_to_cart(session_id, "prod_1", 2)
assert c1["item_count"] == 1 and c1["total_quantity"] == 2
c2 = update_cart_item(session_id, "prod_1", 3)
assert c2["total_quantity"] == 3
log(f"[OK] Cart service: add & update verified (quantity = {c2['total_quantity']})")

# 4. Check Order service
from backend.app.schemas.order import CheckoutRequest
from backend.app.services.order_service import create_order, get_order, update_order_status, reset_order_status

req = CheckoutRequest(
    session_id=session_id,
    customer_name="Rohan Verma",
    mobile_number="9876543210",
    delivery_address="Flat 102, Sunrise Apt, Koramangala",
    landmark="Near Park",
    pincode="560095",
    locality="Koramangala",
    payment_method="cod"
)
order = create_order(req)
oid = order["order_id"]
log(f"[OK] Order created: {oid}, status: {order['status']}, rider: {order['rider_name']}")

# Advance status
o_upd = update_order_status(oid)
log(f"[OK] Order advanced: {o_upd['status']}")
o_reset = reset_order_status(oid)
log(f"[OK] Order reset: {o_reset['status']}")

# 5. Check Router functions
from backend.app.routers.products import get_products, get_product_by_id
from backend.app.routers.categories import get_categories, get_category_products
from backend.app.routers.search import search_products, get_search_suggestions

prod_list = get_products(category="vegetables-fruits", limit=5)
assert len(prod_list["products"]) == 5
log(f"[OK] Router get_products: {len(prod_list['products'])} items")

p1 = get_product_by_id("prod_1")
log(f"[OK] Router get_product_by_id: {p1['name']}")

cats = get_categories()
assert len(cats) == 12
log(f"[OK] Router get_categories: {len(cats)} categories")

search_res = search_products("milk")
log(f"[OK] Router search_products: {len(search_res)} items for 'milk'")

sugg = get_search_suggestions("am")
log(f"[OK] Router search_suggestions: {len(sugg['suggestions'])} suggestions")

# 6. Check all frontend HTML and CSS files exist and are non-empty
files = [
    "frontend/index.html",
    "frontend/products.html",
    "frontend/cart.html",
    "frontend/checkout.html",
    "frontend/order-success.html",
    "frontend/tracking.html",
    "frontend/css/style.css",
    "frontend/css/header.css",
    "frontend/css/products.css",
    "frontend/css/cart.css",
    "frontend/css/checkout.css",
    "frontend/css/responsive.css",
    "frontend/js/api.js",
    "frontend/js/app.js",
    "frontend/js/home.js",
    "frontend/js/products.js",
    "frontend/js/search.js",
    "frontend/js/cart.js",
    "frontend/js/checkout.js",
    "frontend/js/tracking.js",
    "deploy/quickkart.service",
    "run.py",
    "requirements.txt",
    "README.md"
]
for f in files:
    assert os.path.exists(f) and os.path.getsize(f) > 0, f"File {f} is missing or empty"
log(f"[OK] All {len(files)} critical project files verified on disk!")

log("\n🎉 ALL TESTS AND CHECKS PASSED WITH 100% SUCCESS!")
