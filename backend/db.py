import json
import os
from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.abspath('moodtunes.db')}")
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, future=True)
Base = declarative_base()


class MoodRecord(Base):
    __tablename__ = "mood_records"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    selected_mood = Column(String(64), nullable=True)
    region = Column(String(64), nullable=True)
    language = Column(String(64), nullable=True)
    detected_emotion = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=True)
    spotify_tracks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except:  # pragma: no cover
        session.rollback()
        raise
    finally:
        session.close()


def save_mood_record(email=None, name=None, selected_mood=None, region=None, language=None,
                     detected_emotion=None, confidence=None, spotify_tracks=None):
    if detected_emotion is None:
        raise ValueError("detected_emotion is required")

    payload = json.dumps(spotify_tracks or [], default=str)
    with session_scope() as session:
        record = MoodRecord(
            email=email,
            name=name,
            selected_mood=selected_mood,
            region=region,
            language=language,
            detected_emotion=detected_emotion,
            confidence=confidence,
            spotify_tracks=payload,
        )
        session.add(record)
        session.flush()
        return record


def fetch_mood_records(email=None, limit=10):
    with session_scope() as session:
        query = session.query(MoodRecord).order_by(MoodRecord.created_at.desc())
        if email:
            query = query.filter(MoodRecord.email == email)
        return query.limit(limit).all()

