from typing import List, Dict
from datetime import datetime
from app.utils.contract_specs import get_point_value

def consolidate_fills(fills: List[Dict], wakeup_account_id: str, user_id: str) -> List[Dict]:
    """
    Groups raw Rithmic fills into round-trip trades.
    A round-trip trade has an entry, an exit, and a realized PnL.
    """
    # Group by symbol
    grouped_fills = {}
    for fill in fills:
        sym = fill.get("security_code")
        if sym not in grouped_fills:
            grouped_fills[sym] = []
        grouped_fills[sym].append(fill)

    consolidated_trades = []

    for sym, symbol_fills in grouped_fills.items():
        # Sort chronologically
        symbol_fills.sort(key=lambda x: x.get("update_time", ""))

        position = 0
        current_trade = None

        for fill in symbol_fills:
            qty = fill.get("quantity", 0)
            side = fill.get("transaction_type") # "BUY" or "SELL"
            price = fill.get("fill_price", 0.0)
            timestamp = fill.get("update_time")
            fill_id = fill.get("order_id")

            multiplier = 1 if side == "BUY" else -1
            fill_qty_signed = qty * multiplier

            if position == 0:
                # Opening a new position
                position += fill_qty_signed
                current_trade = {
                    "user_id": user_id,
                    "account_id": wakeup_account_id,
                    "par": sym,
                    "trade_type": "buy" if side == "BUY" else "sell",
                    "entry_time": timestamp,
                    "entry_price_sum": price * qty,
                    "entry_qty": qty,
                    "exit_price_sum": 0.0,
                    "exit_qty": 0,
                    "commissions": 0.0, # Approximate or parse from fill if available
                }
            else:
                # Modifying existing position
                new_position = position + fill_qty_signed

                if (position > 0 and new_position < 0) or (position < 0 and new_position > 0):
                    # Position flip (e.g. Long 1, Sell 2 -> Short 1)
                    # Close current trade
                    close_qty = abs(position)
                    current_trade["exit_price_sum"] += price * close_qty
                    current_trade["exit_qty"] += close_qty
                    current_trade["exit_time"] = timestamp
                    current_trade["rithmic_order_id"] = fill_id
                    
                    # Calculate PnL
                    avg_entry = current_trade["entry_price_sum"] / current_trade["entry_qty"]
                    avg_exit = current_trade["exit_price_sum"] / current_trade["exit_qty"]
                    pt_value = get_point_value(sym)
                    direction_mult = 1 if current_trade["trade_type"] == "buy" else -1
                    
                    # Realized PnL = (Exit - Entry) * Qty * PointValue * Direction
                    gross_pnl = (avg_exit - avg_entry) * current_trade["exit_qty"] * pt_value * direction_mult
                    current_trade["pnl_neto"] = gross_pnl - current_trade["commissions"]

                    consolidated_trades.append(current_trade)

                    # Open new trade with remaining qty
                    remaining_qty = abs(new_position)
                    position = new_position
                    current_trade = {
                        "user_id": user_id,
                        "account_id": wakeup_account_id,
                        "par": sym,
                        "trade_type": "buy" if side == "BUY" else "sell",
                        "entry_time": timestamp,
                        "entry_price_sum": price * remaining_qty,
                        "entry_qty": remaining_qty,
                        "exit_price_sum": 0.0,
                        "exit_qty": 0,
                        "commissions": 0.0,
                    }
                else:
                    # Scaling in or scaling out
                    if (position > 0 and fill_qty_signed > 0) or (position < 0 and fill_qty_signed < 0):
                        # Scale in
                        current_trade["entry_price_sum"] += price * qty
                        current_trade["entry_qty"] += qty
                        position = new_position
                    else:
                        # Scale out (partial or full close)
                        current_trade["exit_price_sum"] += price * qty
                        current_trade["exit_qty"] += qty
                        position = new_position

                        if position == 0:
                            # Full close
                            current_trade["exit_time"] = timestamp
                            current_trade["rithmic_order_id"] = fill_id
                            
                            avg_entry = current_trade["entry_price_sum"] / current_trade["entry_qty"]
                            avg_exit = current_trade["exit_price_sum"] / current_trade["exit_qty"]
                            pt_value = get_point_value(sym)
                            direction_mult = 1 if current_trade["trade_type"] == "buy" else -1
                            
                            gross_pnl = (avg_exit - avg_entry) * current_trade["exit_qty"] * pt_value * direction_mult
                            current_trade["pnl_neto"] = gross_pnl - current_trade["commissions"]

                            consolidated_trades.append(current_trade)
                            current_trade = None

    # Clean up fields before returning
    final_trades = []
    for t in consolidated_trades:
        final_trades.append({
            "user_id": t["user_id"],
            "account_id": t["account_id"],
            "par": t["par"],
            "trade_type": t["trade_type"],
            "entry_time": t["entry_time"],
            "exit_time": t["exit_time"],
            "pnl_neto": round(t["pnl_neto"], 2),
            "rithmic_order_id": t["rithmic_order_id"]
        })

    return final_trades
