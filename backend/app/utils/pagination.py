import math
from typing import TypeVar, List
from fastapi import Query
from pydantic import BaseModel
from typing import Generic

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


class PaginationParams:
    def __init__(
        self,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
    ):
        self.page = page
        self.page_size = page_size

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def paginate(items: List[T], total: int, params: PaginationParams) -> PaginatedResponse[T]:
    return PaginatedResponse(
        items=items, total=total, page=params.page, page_size=params.page_size,
        total_pages=math.ceil(total / params.page_size) if params.page_size else 1,
    )
