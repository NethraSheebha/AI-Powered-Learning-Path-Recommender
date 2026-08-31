import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# Support JSONB on PostgreSQL with generic JSON fallback
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")

class Graph(Base):
    __tablename__ = "graphs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    learner_id = Column(String(36), ForeignKey("learners.id", ondelete="CASCADE"), nullable=False)
    goal_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    learner = relationship("Learner", back_populates="graphs")
    nodes = relationship("Node", back_populates="graph", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="graph", cascade="all, delete-orphan")
    graph_diffs = relationship("GraphDiff", back_populates="graph", cascade="all, delete-orphan")


class Node(Base):
    __tablename__ = "nodes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    graph_id = Column(String(36), ForeignKey("graphs.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    rubric = Column(JSON_TYPE, nullable=True)
    resources = Column(JSON_TYPE, nullable=True)
<<<<<<< HEAD
=======
    quiz_questions = Column(JSON_TYPE, nullable=True)
>>>>>>> main
    status = Column(String(50), nullable=False, default="locked")  # locked | available | mastered
    p_init = Column(Float, nullable=False, default=0.1)
    p_transit = Column(Float, nullable=False, default=0.1)
    p_slip = Column(Float, nullable=False, default=0.1)
    p_guess = Column(Float, nullable=False, default=0.2)
    p_mastery = Column(Float, nullable=False, default=0.0)

    graph = relationship("Graph", back_populates="nodes")
    evidence_events = relationship("EvidenceEvent", back_populates="node", cascade="all, delete-orphan")
    outgoing_edges = relationship("Edge", foreign_keys="Edge.from_node_id", back_populates="from_node", cascade="all, delete-orphan")
    incoming_edges = relationship("Edge", foreign_keys="Edge.to_node_id", back_populates="to_node", cascade="all, delete-orphan")


class Edge(Base):
    __tablename__ = "edges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    graph_id = Column(String(36), ForeignKey("graphs.id", ondelete="CASCADE"), nullable=False)
    from_node_id = Column(String(36), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    to_node_id = Column(String(36), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    edge_type = Column(String(50), nullable=False)  # prerequisite | remedial

    graph = relationship("Graph", back_populates="edges")
    from_node = relationship("Node", foreign_keys=[from_node_id], back_populates="outgoing_edges")
    to_node = relationship("Node", foreign_keys=[to_node_id], back_populates="incoming_edges")
