import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = os.getenv("APP_NAME", "AI-Powered-Learning-Path-Recommender API")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://ai_learning_path_user:ai_learning_path_pass@localhost:5432/ai_learning_path_db"
    )

settings = Settings()
