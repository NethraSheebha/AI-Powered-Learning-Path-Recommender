import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Learner(Base):
    __tablename__ = "learners"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    goal_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    graphs = relationship("Graph", back_populates="learner", cascade="all, delete-orphan")
    evidence_events = relationship("EvidenceEvent", back_populates="learner", cascade="all, delete-orphan")
