import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")

class EvidenceEvent(Base):
    __tablename__ = "evidence_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    node_id = Column(String(36), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    learner_id = Column(String(36), ForeignKey("learners.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # quiz | project
    raw_score = Column(Float, nullable=False)
    correct = Column(Boolean, nullable=False, default=False)
    rubric_result = Column(JSON_TYPE, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    node = relationship("Node", back_populates="evidence_events")
    learner = relationship("Learner", back_populates="evidence_events")
    graph_diffs = relationship("GraphDiff", back_populates="trigger_event")
