# Wakeup Journal - Rithmic Sync Service

A standalone Backend-for-Frontend (BFF) built with FastAPI to synchronize Rithmic trading accounts (used by Lucid, TradeSea, Apex, etc.) with Wakeup Journal.

## Setup

1. Copy `.env.example` to `.env` and fill in the required Supabase credentials.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run locally:
   ```bash
   uvicorn main:app --reload
   ```

## Deployment

Deploy this service on Render, Railway, or Fly.io. Ensure it's served over HTTPS.
The environment variables from `.env` must be added to the hosting provider's secrets.
