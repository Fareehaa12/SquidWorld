"""
Analytics engine for cost savings comparison.
PPO vs Naive (s,Q) baseline.
All values in PKR.
"""

import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any


def compute_order_qty(annual_demand: float, ordering_cost: float, holding_cost_annual: float) -> float:
    if holding_cost_annual <= 0 or annual_demand <= 0:
        return 100.0
    return math.sqrt(2 * annual_demand * ordering_cost / holding_cost_annual)


def compute_baseline_metrics(
    sku_configs: List[Dict],
    avg_daily_demands: List[float],
    episode_days: int,
) -> Dict[str, Any]:
    results = []
    for cfg, avg_d in zip(sku_configs, avg_daily_demands):
        annual_d = avg_d * episode_days
        holding_annual = cfg["holding_cost_per_day"] * episode_days
        qty = compute_order_qty(annual_d, cfg["ordering_cost"], holding_annual)
        num_orders = annual_d / qty if qty > 0 else 0
        avg_inv = qty / 2
        total_ordering = num_orders * cfg["ordering_cost"]
        total_holding = avg_inv * holding_annual
        total_revenue = annual_d * cfg["unit_cost"] * 1.2 * 0.92
        results.append({
            "sku_id": cfg["sku_id"],
            "order_qty": round(qty, 1),
            "num_orders": round(num_orders, 1),
            "avg_inventory": round(avg_inv, 1),
            "total_ordering_cost": round(total_ordering, 2),
            "total_holding_cost": round(total_holding, 2),
            "total_revenue": round(total_revenue, 2),
            "net_profit": round(total_revenue - total_ordering - total_holding, 2),
        })
    return results


def build_savings_report(
    ppo_summary: Dict[str, Any],
    baseline_metrics: List[Dict[str, Any]],
    currency_symbol: str = "₨",
) -> Dict[str, Any]:
    baseline_total_profit = sum(m["net_profit"] for m in baseline_metrics)
    ppo_profit = ppo_summary["net_profit"]
    savings = ppo_profit - baseline_total_profit
    savings_pct = (savings / abs(baseline_total_profit) * 100) if baseline_total_profit != 0 else 0

    return {
        "currency": currency_symbol,
        "ppo_net_profit": round(ppo_profit, 2),
        "baseline_net_profit": round(baseline_total_profit, 2),
        "savings_pkr": round(savings, 2),
        "savings_pct": round(savings_pct, 2),
        "service_level_ppo": ppo_summary.get("service_level", 0),
        "num_stockouts_ppo": ppo_summary.get("num_stockouts", 0),
        "avg_inventory_ppo": ppo_summary.get("avg_inventory", 0),
        "baseline_breakdown": baseline_metrics,
        "daily_savings_pkr": round(savings / ppo_summary.get("total_days", 365), 2),
    }


def generate_time_series_chart_data(step_log: List[Dict]) -> Dict[str, Any]:
    """Build daily aggregated data for frontend charts."""
    df = pd.DataFrame(step_log)
    if df.empty:
        return {}

    daily = (
        df.groupby("day")
        .agg(
            total_revenue=("revenue", "sum"),
            total_holding=("holding_cost", "sum"),
            total_stockout=("stockout_cost", "sum"),
            total_ordering=("ordering_cost", "sum"),
            avg_stock=("stock_level", "mean"),
            total_demand=("demand", "sum"),
            total_fulfilled=("fulfilled", "sum"),
        )
        .reset_index()
    )
    daily["net_reward"] = (
        daily["total_revenue"]
        - daily["total_holding"]
        - daily["total_stockout"]
        - daily["total_ordering"]
    )
    daily["cumulative_profit"] = daily["net_reward"].cumsum()
    daily["fill_rate"] = daily["total_fulfilled"] / daily["total_demand"].replace(0, 1)

    return daily.to_dict(orient="list")
