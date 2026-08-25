from datetime import date

from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    crop_type: str = Field(min_length=2, max_length=60)
    grade: str = "Grade A"
    total_kg: int = Field(gt=0)
    price_per_kg: float = Field(gt=0)
    region: str
    notes: str | None = None
    commit_deadline: date | None = None
    delivery_date: date | None = None


class ContractOut(BaseModel):
    id: int
    buyer_id: int
    buyer_name: str | None = None
    crop_type: str
    grade: str
    total_kg: int
    committed_kg: int
    price_per_kg: float
    region: str
    notes: str | None = None
    commit_deadline: str | None = None
    delivery_date: str | None = None
    status: str


class CommitmentCreate(BaseModel):
    quantity_kg: int = Field(gt=0)
    client_action_id: str | None = None  # idempotency key for offline sync


class CommitmentOut(BaseModel):
    id: int
    contract_id: int
    farmer_id: int
    farmer_name: str | None = None
    quantity_kg: int
    status: str
    sync_status: str
    committed_at: str
