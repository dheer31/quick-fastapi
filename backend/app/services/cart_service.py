from typing import Dict, Any, Optional
from ..data.products import PRODUCTS
from .pricing_service import calculate_totals

# In-memory session cart store
# Structure: {session_id: {"items": {product_id: quantity}, "coupon": code}}
CARTS: Dict[str, Dict[str, Any]] = {}

PRODUCT_MAP = {p["id"]: p for p in PRODUCTS}

def _get_or_create_cart(session_id: str) -> Dict[str, Any]:
    if session_id not in CARTS:
        CARTS[session_id] = {
            "items": {},  # {prod_id: qty}
            "coupon": None
        }
    return CARTS[session_id]

def get_cart_response(session_id: str) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    items_detail = []
    
    for prod_id, qty in list(cart["items"].items()):
        if qty <= 0:
            del cart["items"][prod_id]
            continue
        product = PRODUCT_MAP.get(prod_id)
        if product:
            item_total = round(product["price"] * qty, 2)
            items_detail.append({
                "product_id": prod_id,
                "name": product["name"],
                "price": product["price"],
                "original_price": product["original_price"],
                "discount": product["discount"],
                "weight": product["weight"],
                "image_url": product["image_url"],
                "quantity": qty,
                "item_total": item_total
            })
        else:
            # Stale product id
            del cart["items"][prod_id]
            
    totals = calculate_totals(items_detail, cart["coupon"])
    
    # If coupon became invalid (e.g. subtotal fell below min order), reset it
    if cart["coupon"] and totals["coupon_code"] is None:
        cart["coupon"] = None
        
    return {
        "session_id": session_id,
        "items": items_detail,
        "item_count": len(items_detail),
        "total_quantity": sum(i["quantity"] for i in items_detail),
        "subtotal": totals["subtotal"],
        "handling_charge": totals["handling_charge"],
        "delivery_charge": totals["delivery_charge"],
        "discount": totals["coupon_discount"],
        "coupon_code": totals["coupon_code"],
        "grand_total": totals["grand_total"],
        "total_savings": totals["total_savings"],
        "free_delivery_threshold": totals["free_delivery_threshold"],
        "amount_needed_for_free_delivery": totals["amount_needed_for_free_delivery"]
    }

def add_to_cart(session_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    if product_id not in PRODUCT_MAP:
        raise ValueError(f"Product {product_id} not found")
        
    product = PRODUCT_MAP[product_id]
    if not product.get("stock_availability", True):
        raise ValueError(f"Product {product['name']} is currently out of stock")
        
    current_qty = cart["items"].get(product_id, 0)
    new_qty = current_qty + quantity
    cart["items"][product_id] = new_qty
    return get_cart_response(session_id)

def update_cart_item(session_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    if product_id not in PRODUCT_MAP:
        raise ValueError(f"Product {product_id} not found")
        
    if quantity <= 0:
        if product_id in cart["items"]:
            del cart["items"][product_id]
    else:
        cart["items"][product_id] = quantity
        
    return get_cart_response(session_id)

def remove_from_cart(session_id: str, product_id: str) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    if product_id in cart["items"]:
        del cart["items"][product_id]
    return get_cart_response(session_id)

def clear_cart(session_id: str) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    cart["items"] = {}
    cart["coupon"] = None
    return get_cart_response(session_id)

def apply_coupon_to_cart(session_id: str, coupon_code: str) -> Dict[str, Any]:
    cart = _get_or_create_cart(session_id)
    cart["coupon"] = coupon_code.strip().upper()
    return get_cart_response(session_id)
