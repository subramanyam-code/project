from pydantic import BaseModel
from typing import TypeVar, Generic, List, Optional, Any

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    data: Optional[Any] = None
