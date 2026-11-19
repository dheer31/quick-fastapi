from typing import List
from fastapi import APIRouter, HTTPException
from ..data.categories import CATEGORIES
from ..data.products import PRODUCTS
from ..schemas.product import Product

router = APIRouter(prefix="/api/categories", tags=["Categories"])

CATEGORY_MAP = {c["id"]: c for c in CATEGORIES}

@router.get("")
def get_categories():
    """
    Returns all categories with calculated product counts.
    """
    counts = {}
    for p in PRODUCTS:
        cid = p["category_id"]
        counts[cid] = counts.get(cid, 0) + 1
        
    enriched = []
    for c in CATEGORIES:
        cat_data = dict(c)
        cat_data["product_count"] = counts.get(c["id"], 0)
        enriched.append(cat_data)
        
    return enriched

@router.get("/{category_id}/products", response_model=List[Product])
def get_category_products(category_id: str):
    """
    Returns all products belonging to a specific category.
    """
    cat_lower = category_id.lower().strip()
    if cat_lower not in CATEGORY_MAP:
        raise HTTPException(status_code=404, detail=f"Category '{category_id}' not found")
        
    matching = [p for p in PRODUCTS if p["category_id"].lower() == cat_lower]
    return matching
