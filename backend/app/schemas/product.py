from typing import Optional, List
from pydantic import BaseModel, Field

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    original_price: float
    discount: int
    weight: str
    category_id: str
    image_url: str
    stock_availability: bool = True
    delivery_estimate: str = "10 MINS"
    rating: float = 4.8
    rating_count: int = 100
    is_bestseller: bool = False
    collection: Optional[str] = None

class ProductListResponse(BaseModel):
    total: int
    products: List[Product]
