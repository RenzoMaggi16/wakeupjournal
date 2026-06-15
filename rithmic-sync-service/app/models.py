from pydantic import BaseModel, SecretStr, Field
from typing import Optional
from datetime import datetime

class SyncRequest(BaseModel):
    user_id: str
    rithmic_username: str
    rithmic_password: SecretStr = Field(exclude=True) # Excluded from logs/docs
    system_name: Optional[str] = None
    account_id: Optional[str] = None
    environment: str = "demo"

class SyncStatusResponse(BaseModel):
    status: str
    last_sync_at: Optional[datetime]
    error_message: Optional[str]

class NormalizedTrade(BaseModel):
    user_id: str
    account_id: str # The WakeupJournal generic account UUID
    entry_time: str
    exit_time: str
    par: str
    trade_type: str # "buy" or "sell"
    pnl_neto: float
    rithmic_order_id: str
