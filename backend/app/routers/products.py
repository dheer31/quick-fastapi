from typing import Optional, List
from fastapi import APIRouter, HTTPException
from ..data.products import PRODUCTS
from ..schemas.product import Product, ProductListResponse

router = APIRouter(prefix="/api/products", tags=["Products"])

PRODUCT_MAP = {p["id"]: p for p in PRODUCTS}

@router.get("", response_model=ProductListResponse)
def get_products(
    category: Optional[str] = None,
    collection: Optional[str] = None,
    sort: Optional[str] = None,
    discount: Optional[bool] = None,
    in_stock_only: Optional[bool] = False,
    limit: Optional[int] = None,
    offset: Optional[int] = 0
):
    results = list(PRODUCTS)
    
    # Category filter
    if category and isinstance(category, str) and category.lower() != "all":
        cat_lower = category.lower().strip()
        results = [p for p in results if p["category_id"].lower() == cat_lower]
        
    # Collection filter
    if collection and isinstance(collection, str):
        coll_lower = collection.lower().strip()
        results = [p for p in results if p.get("collection", "").lower() == coll_lower or (coll_lower == "bestseller products" and p.get("is_bestseller"))]
        
    # Discount filter
    if discount is True:
        results = [p for p in results if p["discount"] > 0]
        
    # In stock filter
    if in_stock_only is True:
        results = [p for p in results if p.get("stock_availability", True)]
        
    # Sorting
    if sort == "price_low":
        results.sort(key=lambda x: x["price"])
    elif sort == "price_high":
        results.sort(key=lambda x: x["price"], reverse=True)
    elif sort == "discount":
        results.sort(key=lambda x: x["discount"], reverse=True)
    elif sort == "popular":
        results.sort(key=lambda x: (x.get("is_bestseller", False), x.get("rating_count", 0)), reverse=True)
        
    total = len(results)
    if limit is not None and isinstance(limit, int):
        results = results[offset: offset + limit]
    elif offset and isinstance(offset, int) and offset > 0:
        results = results[offset:]
        
    return {"total": total, "products": results}

@router.get("/{product_id}", response_model=Product)
def get_product_by_id(product_id: str):
    product = PRODUCT_MAP.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id '{product_id}' not found")
    return product
