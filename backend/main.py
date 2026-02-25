from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from databases import get_targets_collection

app = FastAPI()

# Enable React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/add-to-watchlist/{email}")
async def add_to_watchlist(email: str):
    # logic to get data from mongo...
    return {
        "status": "EXPOSED", 
        "source_url": "https://pastebin.com/leaked-data-2026", 
        "risk_score": "94%"
    }
