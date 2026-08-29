from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class LearnerCreate(BaseModel):
    name: str = Field(..., example="Alice Developer")
    goal_text: str = Field(..., example="Become a Backend Developer")

class LearnerResponse(BaseModel):
    id: str
    name: str
    goal_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
