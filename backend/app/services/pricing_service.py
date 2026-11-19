from typing import Dict, Any, Optional
from ..data.coupons import COUPONS

HANDLING_CHARGE = 2.0
STANDARD_DELIVERY_CHARGE = 15.0
FREE_DELIVERY_THRESHOLD = 199.0

def validate_coupon(code: str, subtotal: float) -> Dict[str, Any]:
    """
    Validates a coupon code against subtotal and calculates discount.
    """
    if not code:
        return {"valid": False, "discount": 0.0, "message": "No coupon provided", "min_order_value": 0.0}
    
    code_upper = code.strip().upper()
    if code_upper not in COUPONS:
        return {"valid": False, "discount": 0.0, "message": f"Coupon '{code}' is invalid", "min_order_value": 0.0}
    
    coupon = COUPONS[code_upper]
    min_order = coupon["min_order_value"]
    
    if subtotal < min_order:
        return {
            "valid": False,
            "discount": 0.0,
            "message": f"Add items worth ₹{min_order - subtotal:.0f} more to use coupon {code_upper}",
            "min_order_value": min_order
        }
    
    discount = 0.0
    if coupon["type"] == "percentage":
        discount = (subtotal * coupon["value"]) / 100.0
        discount = min(discount, coupon["max_discount"])
    elif coupon["type"] == "flat":
        discount = coupon["value"]
    elif coupon["type"] == "free_delivery":
        discount = STANDARD_DELIVERY_CHARGE  # Effectively free delivery
    
    return {
        "valid": True,
        "code": code_upper,
        "discount": round(discount, 2),
        "message": f"Coupon {code_upper} applied successfully! You saved ₹{round(discount, 2)}",
        "min_order_value": min_order
    }

def calculate_totals(items: list, coupon_code: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculates detailed pricing totals including discounts and delivery fees.
    """
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    mrp_total = sum(item["original_price"] * item["quantity"] for item in items)
    catalog_discount = max(0.0, mrp_total - subtotal)
    
    # Delivery fee logic
    if subtotal == 0:
        delivery_charge = 0.0
        handling_charge = 0.0
    elif subtotal >= FREE_DELIVERY_THRESHOLD:
        delivery_charge = 0.0
        handling_charge = HANDLING_CHARGE
    else:
        delivery_charge = STANDARD_DELIVERY_CHARGE
        handling_charge = HANDLING_CHARGE
        
    coupon_discount = 0.0
    applied_coupon = None
    if coupon_code and subtotal > 0:
        validation = validate_coupon(coupon_code, subtotal)
        if validation["valid"]:
            coupon_discount = validation["discount"]
            applied_coupon = validation["code"]
            if COUPONS.get(applied_coupon, {}).get("type") == "free_delivery":
                delivery_charge = 0.0
                coupon_discount = 0.0  # Already zeroed out delivery
    
    grand_total = max(0.0, subtotal + handling_charge + delivery_charge - coupon_discount)
    total_savings = catalog_discount + coupon_discount
    if subtotal >= FREE_DELIVERY_THRESHOLD and subtotal > 0:
        total_savings += STANDARD_DELIVERY_CHARGE  # Saved on delivery
        
    amount_needed_for_free = max(0.0, FREE_DELIVERY_THRESHOLD - subtotal) if subtotal > 0 else 0.0

    return {
        "subtotal": round(subtotal, 2),
        "mrp_total": round(mrp_total, 2),
        "catalog_discount": round(catalog_discount, 2),
        "handling_charge": round(handling_charge, 2),
        "delivery_charge": round(delivery_charge, 2),
        "coupon_code": applied_coupon,
        "coupon_discount": round(coupon_discount, 2),
        "grand_total": round(grand_total, 2),
        "total_savings": round(total_savings, 2),
        "free_delivery_threshold": FREE_DELIVERY_THRESHOLD,
        "amount_needed_for_free_delivery": round(amount_needed_for_free, 2)
    }
