from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.supabase_client import supabase_client

router = APIRouter()

class RithmicConnection(BaseModel):
    user_id: str
    rithmic_account_id: str
    system_name: str
    gateway_environment: str = 'demo'

@router.get("/{user_id}")
def get_connection(user_id: str):
    response = supabase_client.table("rithmic_connections").select("*").eq("user_id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Connection not found")
    return response.data[0]

@router.post("/")
def create_connection(conn: RithmicConnection):
    # Upsert the connection info (no passwords!)
    data = {
        "user_id": conn.user_id,
        "rithmic_account_id": conn.rithmic_account_id,
        "system_name": conn.system_name,
        "gateway_environment": conn.gateway_environment,
        "status": "disconnected"
    }
    
    # Check if exists
    existing = supabase_client.table("rithmic_connections").select("id").eq("user_id", conn.user_id).execute()
    
    if existing.data:
        response = supabase_client.table("rithmic_connections").update(data).eq("user_id", conn.user_id).execute()
    else:
        response = supabase_client.table("rithmic_connections").insert(data).execute()
        
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to save connection")
        
    return response.data[0]

@router.delete("/{user_id}")
def delete_connection(user_id: str):
    response = supabase_client.table("rithmic_connections").delete().eq("user_id", user_id).execute()
    return {"message": "Connection deleted"}
