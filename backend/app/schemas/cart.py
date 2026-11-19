from typing import Optional, List
from pydantic import BaseModel, Field

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)

class CartItemDetail(BaseModel):
    product_id: str
    name: str
    price: float
    original_price: float
    discount: int
    weight: str
    image_url: str
    quantity: int
    item_total: float

class CartResponse(BaseModel):
    session_id: str
    items: List[CartItemDetail]
    item_count: int
    total_quantity: int
    subtotal: float
    handling_charge: float
    delivery_charge: float
    discount: float
    coupon_code: Optional[str] = None
    grand_total: float
    total_savings: float
    free_delivery_threshold: float = 199.0
    amount_needed_for_free_delivery: float = 0.0

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: Optional[float] = None

class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount: float
    message: str
    min_order_value: float = 0.0
