from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from backend.databases import get_targets_collection, get_alerts_collection
import time

app = FastAPI(title="Project SHIELD API", version="2.0")

# ── CORS: Allow React dev server ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _serialize(doc: dict) -> dict:
    """Return a JSON-safe copy of a MongoDB document."""
    d = dict(doc)
    d["_id"] = str(d["_id"])
    return d


# ─────────────────────────────────────────────
#  HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "online", "version": "2.0"}


# ─────────────────────────────────────────────
#  TARGETS
# ─────────────────────────────────────────────
@app.get("/targets")
async def get_targets():
    col = get_targets_collection()
    targets = list(col.find({}).sort("_id", -1))
    return [_serialize(t) for t in targets]


@app.get("/add-to-watchlist/{email}")
async def add_to_watchlist(email: str):
    col = get_targets_collection()

    existing = col.find_one({"email": email})
    if existing:
        return {"status": "ALREADY_EXISTS", "id": str(existing["_id"])}

    doc = {
        "email": email,
        "status": "PENDING",
        "risk_score": 0,
        "last_scan": "Awaiting...",
        "source_url": "",
        "evidence_title": "",
        "added_at": time.ctime()
    }
    result = col.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@app.delete("/targets/{target_id}")
async def delete_target(target_id: str):
    col = get_targets_collection()
    try:
        oid = ObjectId(target_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid target ID format")

    result = col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")

    return {"status": "DELETED", "id": target_id}


# ─────────────────────────────────────────────
#  ALERTS
# ─────────────────────────────────────────────
@app.get("/alerts")
async def get_alerts():
    col = get_alerts_collection()
    alerts = list(col.find({}).sort("_id", -1).limit(50))
    return [_serialize(a) for a in alerts]
