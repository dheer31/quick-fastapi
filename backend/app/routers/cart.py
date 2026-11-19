from typing import Optional
from fastapi import APIRouter, Header, Query, HTTPException, status
from ..schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from ..services import cart_service

router = APIRouter(prefix="/api/cart", tags=["Cart"])

def resolve_session(
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
) -> str:
    if isinstance(x_session_id, str) and x_session_id:
        return x_session_id
    if isinstance(session_id, str) and session_id:
        return session_id
    return "demo-session"

@router.get("", response_model=CartResponse)
def get_cart(
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
):
    sid = resolve_session(x_session_id, session_id)
    return cart_service.get_cart_response(sid)

@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    payload: CartItemAdd,
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
):
    sid = resolve_session(x_session_id, session_id)
    try:
        return cart_service.add_to_cart(sid, payload.product_id, payload.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/items/{product_id}", response_model=CartResponse)
def update_cart_item(
    product_id: str,
    payload: CartItemUpdate,
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
):
    sid = resolve_session(x_session_id, session_id)
    try:
        return cart_service.update_cart_item(sid, product_id, payload.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/items/{product_id}", response_model=CartResponse)
def remove_cart_item(
    product_id: str,
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
):
    sid = resolve_session(x_session_id, session_id)
    return cart_service.remove_from_cart(sid, product_id)

@router.delete("", response_model=CartResponse)
def clear_cart(
    x_session_id: Optional[str] = Header(None),
    session_id: Optional[str] = Query(None)
):
    sid = resolve_session(x_session_id, session_id)
    return cart_service.clear_cart(sid)
