from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    reviewee_id: str
    contract_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=500)


class ReviewOut(BaseModel):
    id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_role: str
    reviewee_id: str
    reviewee_name: str
    reviewee_role: str
    contract_id: str | None = None
    rating: int
    comment: str
    created_at: str
