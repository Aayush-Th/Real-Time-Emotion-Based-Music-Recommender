"""
MongoDB database models and utilities for MoodTunes
"""
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "moodtunes")

# Initialize MongoDB connection
try:
    client = MongoClient(MONGODB_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    db = None


class MoodRecord:
    """Model for storing mood and emotion records"""
    
    def __init__(self):
        if db is not None:
            self.collection = db["mood_records"]
            # Create indexes
            self.collection.create_index("email")
            self.collection.create_index("created_at")
    
    def create(self, email=None, name=None, selected_mood=None, region=None, 
               language=None, detected_emotion=None, confidence=None, 
               spotify_tracks=None, image_data=None):
        """Create a new mood record"""
        if detected_emotion is None:
            raise ValueError("detected_emotion is required")
        
        record = {
            "email": email,
            "name": name,
            "selected_mood": selected_mood,
            "region": region,
            "language": language,
            "detected_emotion": detected_emotion,
            "confidence": confidence,
            "spotify_tracks": spotify_tracks or [],
            "image_data": image_data,
            "created_at": datetime.utcnow()
        }
        
        result = self.collection.insert_one(record)
        record["_id"] = str(result.inserted_id)
        return record
    
    def find_by_email(self, email, limit=10):
        """Find mood records by email"""
        records = list(self.collection.find(
            {"email": email}
        ).sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string
        for record in records:
            record["_id"] = str(record["_id"])
        
        return records
    
    def find_all(self, limit=10):
        """Find all mood records"""
        records = list(self.collection.find().sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string
        for record in records:
            record["_id"] = str(record["_id"])
        
        return records
    
    def find_by_id(self, record_id):
        """Find a mood record by ID"""
        try:
            record = self.collection.find_one({"_id": ObjectId(record_id)})
            if record:
                record["_id"] = str(record["_id"])
            return record
        except:
            return None
    
    def update_by_id(self, record_id, update_data):
        """Update a mood record"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(record_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except:
            return False
    
    def delete_by_id(self, record_id):
        """Delete a mood record"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(record_id)})
            return result.deleted_count > 0
        except:
            return False


class UserPreference:
    """Model for storing user preferences"""
    
    def __init__(self):
        if db is not None:
            self.collection = db["user_preferences"]
            self.collection.create_index("email", unique=True)
    
    def create_or_update(self, email, name=None, preferred_language=None, 
                         preferred_region=None, spotify_token=None):
        """Create or update user preferences"""
        if email is None:
            raise ValueError("email is required")
        
        user_data = {
            "email": email,
            "name": name,
            "preferred_language": preferred_language,
            "preferred_region": preferred_region,
            "spotify_token": spotify_token,
            "updated_at": datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {"email": email},
            {"$set": user_data},
            upsert=True
        )
        
        return result.upserted_id or result.matched_count > 0
    
    def find_by_email(self, email):
        """Find user preferences by email"""
        user = self.collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    def update_spotify_token(self, email, spotify_token):
        """Update Spotify token for user"""
        return self.collection.update_one(
            {"email": email},
            {"$set": {"spotify_token": spotify_token}}
        ).modified_count > 0


# Initialize collections
mood_record = MoodRecord() if db else None
user_preference = UserPreference() if db else None


def check_db_connection():
    """Check if MongoDB connection is available"""
    return db is not None
