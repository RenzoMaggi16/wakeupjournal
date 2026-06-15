from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.routes import sync, connections

load_dotenv()

app = FastAPI(
    title="Wakeup Journal - Rithmic Sync Service",
    description="Backend service for synchronizing Rithmic/TradeSea accounts with Wakeup Journal.",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])
app.include_router(connections.router, prefix="/api/rithmic-connections", tags=["Connections"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}
