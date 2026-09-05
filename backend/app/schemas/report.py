from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    reported_user_id: str = Field(min_length=1)
    contract_id: str | None = None
    reason: str = Field(min_length=3, max_length=500)
    category: str = Field(min_length=1, max_length=40)


class ReportOut(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str | None = None
    reporter_role: str
    reported_user_id: str
    reported_user_name: str | None = None
    reported_user_role: str
    contract_id: str | None = None
    reason: str
    category: str
    status: str
    created_at: str
