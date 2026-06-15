from datetime import date, timedelta

def get_sync_date_range(account_creation_date: str | None, last_sync_at: str | None) -> tuple[date, date]:
    """
    Determines the start and end dates for the sync operation.
    """
    today = date.today()
    end_date = today - timedelta(days=1) # Yesterday
    
    start_date = None

    if last_sync_at:
        # If we have a previous sync, start from the day of the last sync
        # Note: In a real implementation, you'd parse the timezone-aware string properly.
        # For simplicity, we just extract the date part (YYYY-MM-DD).
        last_sync_date_str = last_sync_at.split("T")[0]
        start_date = date.fromisoformat(last_sync_date_str)
    elif account_creation_date:
        start_date = date.fromisoformat(account_creation_date)
    else:
        # Default: last 30 days
        start_date = today - timedelta(days=30)
        
    # Ensure start date is not after end date
    if start_date > end_date:
        start_date = end_date
        
    return start_date, end_date
