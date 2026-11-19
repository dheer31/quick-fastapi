import random
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..schemas.order import CheckoutRequest
from .cart_service import get_cart_response, clear_cart

# In-memory orders store: {order_id: order_dict}
ORDERS: Dict[str, Dict[str, Any]] = {}

STATUS_STAGES = [
    "Order Placed",
    "Order Confirmed",
    "Packing",
    "Out for Delivery",
    "Delivered"
]

RIDERS = [
    {"name": "Ramesh Kumar", "phone": "+91 98765 43210", "vehicle": "KA-01-EQ-4421 (Hero Electric)"},
    {"name": "Suresh Gowda", "phone": "+91 98451 22890", "vehicle": "KA-03-MB-8912 (Ather 450X)"},
    {"name": "Arun Patel", "phone": "+91 97410 88319", "vehicle": "KA-04-TR-6530 (Honda Activa)"}
]

def generate_order_id() -> str:
    timestamp = datetime.now().strftime("%Y%m%d")
    rand_num = random.randint(10000, 99999)
    return f"QK-{timestamp}-{rand_num}"

def create_order(request: CheckoutRequest) -> Dict[str, Any]:
    session_id = request.session_id or "demo-session"
    cart = get_cart_response(session_id)
    
    if not cart["items"]:
        raise ValueError("Cannot place order with an empty cart")
        
    order_id = generate_order_id()
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    rider = random.choice(RIDERS)
    
    # Snapshot items
    ordered_items = [
        {
            "product_id": item["product_id"],
            "name": item["name"],
            "price": item["price"],
            "original_price": item["original_price"],
            "weight": item["weight"],
            "image_url": item["image_url"],
            "quantity": item["quantity"],
            "item_total": item["item_total"]
        }
        for item in cart["items"]
    ]
    
    order = {
        "order_id": order_id,
        "session_id": session_id,
        "customer_name": request.customer_name,
        "mobile_number": request.mobile_number,
        "delivery_address": request.delivery_address,
        "landmark": request.landmark or "",
        "pincode": request.pincode,
        "locality": request.locality,
        "payment_method": "Cash on Delivery" if request.payment_method == "cod" else "Demo UPI",
        "delivery_instructions": request.delivery_instructions or "No special instructions",
        "items": ordered_items,
        "subtotal": cart["subtotal"],
        "handling_charge": cart["handling_charge"],
        "delivery_charge": cart["delivery_charge"],
        "discount": cart["discount"],
        "coupon_code": cart["coupon_code"],
        "grand_total": cart["grand_total"],
        "total_savings": cart["total_savings"],
        "status": "Order Placed",
        "status_index": 0,
        "status_history": [
            {
                "status": "Order Placed",
                "time": now_str,
                "description": "Your order has been received and sent to the nearest store."
            }
        ],
        "delivery_estimate": "10-15 minutes",
        "rider_name": rider["name"],
        "rider_phone": rider["phone"],
        "rider_vehicle": rider["vehicle"],
        "created_at": now_str
    }
    
    ORDERS[order_id] = order
    # Clear session cart once order is placed
    clear_cart(session_id)
    return order

def get_order(order_id: str) -> Optional[Dict[str, Any]]:
    return ORDERS.get(order_id)

def list_orders(session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    orders = list(ORDERS.values())
    if session_id:
        orders = [o for o in orders if o.get("session_id") == session_id]
    # Return in reverse chronological order
    return sorted(orders, key=lambda x: x["order_id"], reverse=True)

def update_order_status(order_id: str, new_status: Optional[str] = None) -> Dict[str, Any]:
    if order_id not in ORDERS:
        raise ValueError(f"Order {order_id} not found")
        
    order = ORDERS[order_id]
    current_idx = order.get("status_index", 0)
    
    if new_status:
        if new_status not in STATUS_STAGES:
            raise ValueError(f"Invalid status '{new_status}'. Allowed: {STATUS_STAGES}")
        next_idx = STATUS_STAGES.index(new_status)
    else:
        # Advance to next status cycle
        next_idx = min(current_idx + 1, len(STATUS_STAGES) - 1)
        
    status_name = STATUS_STAGES[next_idx]
    order["status"] = status_name
    order["status_index"] = next_idx
    
    status_descriptions = {
        "Order Placed": "Order received and queued at Indiranagar hub.",
        "Order Confirmed": "Store confirmed items availability. Preparing for packing.",
        "Packing": "Your items are being carefully picked and bagged.",
        "Out for Delivery": f"{order['rider_name']} is on the way with your order!",
        "Delivered": "Order delivered to your doorstep. Enjoy your groceries!"
    }
    
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    # Append to history if not already there for this status
    if not any(h["status"] == status_name for h in order["status_history"]):
        order["status_history"].append({
            "status": status_name,
            "time": now_str,
            "description": status_descriptions[status_name]
        })
        
    return order

def reset_order_status(order_id: str) -> Dict[str, Any]:
    if order_id not in ORDERS:
        raise ValueError(f"Order {order_id} not found")
    order = ORDERS[order_id]
    order["status"] = "Order Placed"
    order["status_index"] = 0
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    order["status_history"] = [{
        "status": "Order Placed",
        "time": now_str,
        "description": "Your order has been received and sent to the nearest store."
    }]
    return order
