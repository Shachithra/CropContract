from pydantic import BaseModel


class ScanResult(BaseModel):
    disease: str
    confidence: float
    severity: str  # low | moderate | high
    treatment_steps: list[str]
    advice: str
    engine: str  # torch | heuristic
