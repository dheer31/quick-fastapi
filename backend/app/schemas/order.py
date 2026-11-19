from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    original_price: float
    weight: str
    image_url: str
    quantity: int
    item_total: float

class CheckoutRequest(BaseModel):
    session_id: Optional[str] = "demo-session"
    customer_name: str = Field(..., min_length=2)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    delivery_address: str = Field(..., min_length=5)
    landmark: Optional[str] = ""
    pincode: str = Field(..., min_length=6, max_length=6)
    locality: str = Field(default="Indiranagar")
    payment_method: str = Field(default="cod")  # cod or upi
    coupon_code: Optional[str] = None
    delivery_instructions: Optional[str] = ""

class OrderStatusUpdate(BaseModel):
    status: str  # "Order Placed", "Order Confirmed", "Packing", "Out for Delivery", "Delivered"

class OrderResponse(BaseModel):
    order_id: str
    session_id: str
    customer_name: str
    mobile_number: str
    delivery_address: str
    landmark: Optional[str] = ""
    pincode: str
    locality: str
    payment_method: str
    items: List[OrderItem]
    subtotal: float
    handling_charge: float
    delivery_charge: float
    discount: float
    coupon_code: Optional[str] = None
    grand_total: float
    total_savings: float
    status: str
    status_index: int
    status_history: List[Dict[str, Any]]
    delivery_estimate: str
    rider_name: str
    rider_phone: str
    rider_vehicle: str
    created_at: str
