"""
Coupons data for QuickKart.
"""

COUPONS = {
    "WELCOME10": {
        "code": "WELCOME10",
        "type": "percentage",
        "value": 10,
        "max_discount": 100,
        "min_order_value": 100,
        "description": "10% OFF up to ₹100 on orders above ₹100"
    },
    "FLAT50": {
        "code": "FLAT50",
        "type": "flat",
        "value": 50,
        "max_discount": 50,
        "min_order_value": 300,
        "description": "Flat ₹50 OFF on orders above ₹300"
    },
    "FREESHIP": {
        "code": "FREESHIP",
        "type": "free_delivery",
        "value": 0,
        "max_discount": 25,
        "min_order_value": 0,
        "description": "FREE Delivery on your order"
    },
    "SUPER100": {
        "code": "SUPER100",
        "type": "flat",
        "value": 100,
        "max_discount": 100,
        "min_order_value": 600,
        "description": "Flat ₹100 OFF on bulk groceries above ₹600"
    }
}
