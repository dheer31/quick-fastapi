from typing import List, Optional
from fastapi import APIRouter
from ..data.products import PRODUCTS
from ..data.categories import CATEGORIES
from ..schemas.product import Product

router = APIRouter(prefix="/api/search", tags=["Search"])

POPULAR_SEARCHES = [
    "Amul Milk",
    "Tomato",
    "Potato Chips",
    "Atta",
    "Coca Cola",
    "Butter",
    "Paneer",
    "Maggi Noodles",
    "Eggs",
    "Bread"
]

@router.get("", response_model=List[Product])
def search_products(
    q: str = "",
    limit: Optional[int] = 30
):
    if not q or not isinstance(q, str):
        return []
    query = q.lower().strip()
    if not query:
        return []
        
    results = []
    # Weighted search: Name exact match > Name startswith > Name contains > Category match > Description match
    def score(p):
        name = p["name"].lower()
        desc = p["description"].lower()
        cat = p["category_id"].lower()
        
        if query == name:
            return 100
        elif name.startswith(query):
            return 80
        elif query in name:
            return 60
        elif query in cat:
            return 40
        elif query in desc:
            return 20
        return 0

    scored = []
    for p in PRODUCTS:
        s = score(p)
        if s > 0:
            scored.append((s, p))
            
    # Sort by relevance score descending, then rating
    scored.sort(key=lambda x: (x[0], x[1].get("rating", 0)), reverse=True)
    lim = limit if isinstance(limit, int) else 30
    return [item[1] for item in scored[:lim]]

@router.get("/suggestions")
def get_search_suggestions(
    q: Optional[str] = None
):
    if not q or not isinstance(q, str) or not q.strip():
        return {
            "popular_searches": POPULAR_SEARCHES,
            "suggestions": []
        }
        
    query = q.lower().strip()
    suggestions = []
    
    # Check matching product names
    for p in PRODUCTS:
        pname = p["name"]
        if query in pname.lower():
            suggestions.append({
                "type": "product",
                "text": pname,
                "category": p["category_id"],
                "price": p["price"]
            })
            if len(suggestions) >= 8:
                break
                
    # Check matching categories
    for c in CATEGORIES:
        if query in c["name"].lower():
            suggestions.append({
                "type": "category",
                "text": c["name"],
                "category_id": c["id"]
            })
            
    return {
        "popular_searches": POPULAR_SEARCHES,
        "suggestions": suggestions
    }
