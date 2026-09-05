from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "CropContract"
    ENV: str = "development"
    PORT: int = 8000
    JWT_SECRET: str = "super_secret_cropcontract_key_2026_mb_spartans"
    JWT_EXPIRE_MINUTES: int = 1440
    MODEL_PATH: str = "./app/ml/model.pt"
    LABELS_PATH: str = "./app/ml/labels.json"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "cropcontract"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
