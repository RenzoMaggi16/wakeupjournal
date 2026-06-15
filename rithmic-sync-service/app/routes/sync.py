from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models import SyncRequest, SyncStatusResponse
from app.supabase_client import supabase_client
from app.rithmic_service import RithmicService
from app.utils.date_ranges import get_sync_date_range
from app.utils.trade_consolidation import consolidate_fills
from datetime import datetime, timezone

router = APIRouter()

async def run_sync_task(req: SyncRequest):
    service = None
    try:
        # 1. Update status to syncing
        supabase_client.table("rithmic_connections").update(
            {"status": "syncing", "error_message": None}
        ).eq("user_id", req.user_id).execute()

        # 2. Get connection info from DB
        conn_res = supabase_client.table("rithmic_connections").select("*").eq("user_id", req.user_id).execute()
        if not conn_res.data:
            raise Exception("Connection record not found")
        conn_data = conn_res.data[0]

        # 3. Connect to Rithmic
        system_name = req.system_name or ("Rithmic Paper Trading" if req.environment == "demo" else "Rithmic")
        service = RithmicService(
            username=req.rithmic_username,
            password=req.rithmic_password.get_secret_value(),
            system_name=system_name,
            environment=req.environment
        )
        await service.connect()

        # 4. Validate or Auto-Discover Account(s)
        accounts_to_sync = []
        if req.account_id:
            is_valid = await service.validate_account(req.account_id)
            if not is_valid:
                raise Exception(f"Account {req.account_id} not found or not authorized.")
            accounts_to_sync = [req.account_id]
        else:
            accounts = await service.client.list_accounts()
            accounts_to_sync = [acc.account_id for acc in accounts]
            if not accounts_to_sync:
                raise Exception("No accounts found for this user.")

        # 5. Determine Date Range
        start_date, end_date = get_sync_date_range(
            conn_data.get("account_creation_date"), 
            conn_data.get("last_sync_at")
        )

        # 6. Fetch Fills & Consolidate per Account
        all_consolidated_trades = []
        for acc_id in accounts_to_sync:
            fills = await service.fetch_order_history(acc_id, start_date, end_date)
            account_trades = consolidate_fills(fills, acc_id, req.user_id)
            all_consolidated_trades.extend(account_trades)

        # 8. Upsert to Supabase
        if all_consolidated_trades:
            # We use upsert with on_conflict handling to deduplicate based on rithmic_order_id
            supabase_client.table("trades").upsert(
                all_consolidated_trades, 
                on_conflict="user_id, rithmic_order_id"
            ).execute()

        # 9. Update Connection Status
        now_iso = datetime.now(timezone.utc).isoformat()
        last_order_id = all_consolidated_trades[-1]["rithmic_order_id"] if all_consolidated_trades else conn_data.get("last_synced_order_id")
        
        # Determine the primary account_id to save in the connection record
        primary_account = req.account_id or (accounts_to_sync[0] if accounts_to_sync else "UNKNOWN")

        supabase_client.table("rithmic_connections").update({
            "status": "connected",
            "last_sync_at": now_iso,
            "last_synced_order_id": last_order_id,
            "rithmic_account_id": primary_account
        }).eq("user_id", req.user_id).execute()

    except Exception as e:
        # Handle Error
        supabase_client.table("rithmic_connections").update({
            "status": "error",
            "error_message": str(e)
        }).eq("user_id", req.user_id).execute()
        
    finally:
        if service:
            await service.disconnect()

@router.post("/", status_code=202)
async def start_sync(req: SyncRequest, background_tasks: BackgroundTasks):
    # Ensure user has a connection record first
    conn = supabase_client.table("rithmic_connections").select("id").eq("user_id", req.user_id).execute()
    if not conn.data:
        # Create a basic record
        supabase_client.table("rithmic_connections").insert({
            "user_id": req.user_id,
            "rithmic_account_id": req.account_id or "PENDING",
            "system_name": req.system_name or "PENDING",
            "gateway_environment": req.environment,
            "status": "disconnected"
        }).execute()
        
    # Kick off background task
    background_tasks.add_task(run_sync_task, req)
    return {"message": "Sync started"}

@router.get("/status/{user_id}", response_model=SyncStatusResponse)
def get_sync_status(user_id: str):
    res = supabase_client.table("rithmic_connections").select("status, last_sync_at, error_message").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    data = res.data[0]
    return SyncStatusResponse(
        status=data["status"],
        last_sync_at=data["last_sync_at"],
        error_message=data["error_message"]
    )
