from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Header
from ..schemas.order import OrderResponse, OrderStatusUpdate
from ..services import order_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("", response_model=List[OrderResponse])
def get_orders(
    session_id: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None)
):
    sid = None
    if isinstance(session_id, str) and session_id:
        sid = session_id
    elif isinstance(x_session_id, str) and x_session_id:
        sid = x_session_id
    return order_service.list_orders(sid)

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(order_id: str):
    order = order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status_endpoint(
    order_id: str,
    payload: Optional[OrderStatusUpdate] = None
):
    status_str = payload.status if payload and isinstance(payload.status, str) else None
    try:
        updated = order_service.update_order_status(order_id, status_str)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{order_id}/reset", response_model=OrderResponse)
def reset_order_status_endpoint(order_id: str):
    try:
        return order_service.reset_order_status(order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
