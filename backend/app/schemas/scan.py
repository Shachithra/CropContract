from pydantic import BaseModel, Field


class ScanResult(BaseModel):
    disease: str
    confidence: float
    severity: str  # low | moderate | high | critical
    treatment_steps: list[str]
    advice: str
    engine: str  # torch | heuristic
    safety_precautions: list[str] | None = None


class ScanReviewRequest(BaseModel):
    action: str = Field(pattern="^(confirmed|dismissed|resolved)$")
    officer_solution: str | None = Field(default=None, max_length=2000)
    safety_precautions: list[str] | None = None
    issue_alert: bool = False
    alert_message: str | None = Field(default=None, max_length=1000)
