from async_rithmic import RithmicClient
from datetime import date, timedelta
import asyncio
import random
from typing import List, Dict

class RateLimitError(Exception):
    pass

class RithmicService:
    GATEWAYS = {
        "demo": "rituz00100.rithmic.com:443",
        "live": "ritm01.rithmic.com:443",
    }

    def __init__(self, username: str, password: str, system_name: str, environment: str = "demo"):
        self.username = username
        self.password = password
        self.system_name = system_name
        self.gateway = self.GATEWAYS.get(environment, self.GATEWAYS["demo"])
        self.client: RithmicClient | None = None

    async def connect(self):
        self.client = RithmicClient(
            user=self.username,
            password=self.password,
            system_name=self.system_name,
            app_name="WakeupJournal",
            app_version="1.0",
            gateway=self.gateway,
        )
        await self.client.connect()

    async def validate_account(self, account_id: str) -> bool:
        if not self.client:
            raise Exception("Client not connected")
        accounts = await self.client.list_accounts()
        return any(acc.account_id == account_id for acc in accounts)

    async def fetch_order_history(self, account_id: str, start_date: date, end_date: date, max_retries: int = 5) -> List[Dict]:
        if not self.client:
            raise Exception("Client not connected")

        all_orders = []
        current = start_date
        while current <= end_date:
            date_str = current.strftime("%Y%m%d")
            for attempt in range(max_retries):
                try:
                    orders = await self.client.show_order_history_summary(date=date_str, account_id=account_id)
                    all_orders.extend(self._filter_valid_orders(orders))
                    break
                except Exception as e:
                    # In a real app, catch the specific exception from async-rithmic
                    if "rate limit" in str(e).lower() or "too many requests" in str(e).lower():
                        backoff = (2 ** attempt) + random.uniform(0, 1)
                        await asyncio.sleep(backoff)
                    else:
                        raise e
            current += timedelta(days=1)
        return all_orders

    @staticmethod
    def _filter_valid_orders(orders: List[Dict]) -> List[Dict]:
        return [o for o in orders if o.get("status") in ("FILLED", "PARTIALLY_FILLED")]

    async def disconnect(self):
        if self.client:
            await self.client.disconnect()
