"""
Analytics endpoints — cost savings, SKU health, scoreboard.
"""

from typing import Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.analytics.cost_analytics import compute_order_qty, build_savings_report
from app.config import settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


class OrderQtyRequest(BaseModel):
    annual_demand: float
    ordering_cost: float
    holding_cost_annual: float


@router.post("/order-qty")
async def calculate_order_qty(req: OrderQtyRequest) -> Dict[str, float]:
    qty = compute_order_qty(req.annual_demand, req.ordering_cost, req.holding_cost_annual)
    return {
        "order_qty": round(qty, 2),
        "num_orders_per_year": round(req.annual_demand / qty, 2) if qty > 0 else 0,
        "avg_inventory": round(qty / 2, 2),
        "total_cost_pkr": round(
            (req.annual_demand / qty) * req.ordering_cost
            + (qty / 2) * req.holding_cost_annual,
            2,
        ),
    }


@router.get("/currency")
async def get_currency_info() -> Dict[str, str]:
    return {
        "currency": settings.currency,
        "symbol": settings.currency_symbol,
    }
