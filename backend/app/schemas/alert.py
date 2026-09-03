from pydantic import BaseModel


class AlertCreate(BaseModel):
    region: str
    disease: str
    message: str


class AlertOut(BaseModel):
    id: str
    region: str
    disease: str
    message: str
    issued_by: str
    issued_by_name: str | None = None
    issued_at: str


class OutbreakOut(BaseModel):
    disease: str
    case_count: int
    risk_level: str
    trend: str
    trend_pct: float
    cases_by_week: dict[str, int]
    week_of: str
    generated_at: str


class DeliveryCreate(BaseModel):
    commitment_id: str
    delivered_qty_kg: float
    quality_grade: str = "Grade A"


class DeliveryOut(BaseModel):
    id: str
    commitment_id: str
    delivered_qty_kg: float
    quality_grade: str
    delivered_at: str
    payment_status: str = "pending"
