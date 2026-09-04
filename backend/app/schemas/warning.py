from pydantic import BaseModel, Field


class WarningCreate(BaseModel):
    target_user_id: str
    reason: str = Field(min_length=5, max_length=500)
    violation_type: str = Field(pattern="^(pricing|disease_report|contract_breach|conduct|other)$")


class WarningOut(BaseModel):
    id: str
    target_user_id: str
    target_user_role: str
    target_user_name: str | None = None
    reason: str
    violation_type: str
    warning_number: int
    issued_by: str
    issued_by_name: str | None = None
    issued_at: str


class BanStatus(BaseModel):
    is_banned: bool
    ban_type: str  # none | temporary | permanent
    banned_until: str | None = None
    remaining_days: int = 0
    remaining_hours: int = 0
    remaining_minutes: int = 0
    warnings_before_ban: int = 0
    total_warnings: int = 0
    reason: str | None = None


class PriceRangeCreate(BaseModel):
    crop_type: str = Field(min_length=2, max_length=60)
    region: str = Field(min_length=2, max_length=60)
    min_price_per_kg: float = Field(gt=0)
    max_price_per_kg: float = Field(gt=0)


class PriceRangeOut(BaseModel):
    id: str
    crop_type: str
    region: str
    min_price_per_kg: float
    max_price_per_kg: float
    set_by: str
    set_by_name: str | None = None
    set_at: str
