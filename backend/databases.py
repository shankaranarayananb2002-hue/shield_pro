from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Standardized URI and DB name for the entire SHIELD ecosystem
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client.ShieldDB

def get_targets_collection():
    return db.targets

def get_alerts_collection():
    return db.alerts
