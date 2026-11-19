from typing import Optional
from fastapi import APIRouter, HTTPException, status
from ..schemas.cart import CouponValidateRequest, CouponValidateResponse
from ..schemas.order import CheckoutRequest, OrderResponse
from ..services.pricing_service import validate_coupon
from ..services.cart_service import apply_coupon_to_cart, get_cart_response
from ..services import order_service

router = APIRouter(prefix="/api", tags=["Checkout & Coupons"])

@router.post("/coupons/validate", response_model=CouponValidateResponse)
def validate_coupon_endpoint(payload: CouponValidateRequest):
    subtotal = payload.subtotal or 0.0
    res = validate_coupon(payload.code, subtotal)
    return res

@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout_endpoint(payload: CheckoutRequest):
    session_id = payload.session_id or "demo-session"
    
    # If coupon was specified in request, apply to cart first
    if payload.coupon_code:
        apply_coupon_to_cart(session_id, payload.coupon_code)
        
    try:
        order = order_service.create_order(payload)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
