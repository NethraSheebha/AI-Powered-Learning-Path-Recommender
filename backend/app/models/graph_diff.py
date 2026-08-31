import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")

class GraphDiff(Base):
    __tablename__ = "graph_diffs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    graph_id = Column(String(36), ForeignKey("graphs.id", ondelete="CASCADE"), nullable=False)
    trigger_event_id = Column(String(36), ForeignKey("evidence_events.id", ondelete="SET NULL"), nullable=True)
    nodes_added = Column(JSON_TYPE, nullable=True)
    edges_added = Column(JSON_TYPE, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    graph = relationship("Graph", back_populates="graph_diffs")
    trigger_event = relationship("EvidenceEvent", back_populates="graph_diffs")
