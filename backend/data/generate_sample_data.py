"""
Generate a sample demand CSV for testing Mode 2 (Upload Your Data).
Produces 180 days of demand for 5 SKUs with seasonal patterns.
Run: python data/generate_sample_data.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

OUT = Path(__file__).parent / "sample_demand.csv"

SKU_CONFIGS = [
    {"sku_id": "RICE-001",   "base": 120, "cost": 800,  "lead": 3},
    {"sku_id": "FLOUR-002",  "base": 90,  "cost": 600,  "lead": 4},
    {"sku_id": "OIL-003",    "base": 60,  "cost": 1500, "lead": 7},
    {"sku_id": "SUGAR-004",  "base": 75,  "cost": 700,  "lead": 5},
    {"sku_id": "PULSES-005", "base": 50,  "cost": 1200, "lead": 6},
]

rng = np.random.default_rng(42)
rows = []
start = pd.Timestamp("2024-01-01")

for cfg in SKU_CONFIGS:
    for d in range(180):
        date = start + pd.Timedelta(days=d)
        seasonal = 1.0 + 0.25 * np.sin(2 * np.pi * d / 365)
        noise = rng.normal(1.0, 0.15)
        demand = max(0, cfg["base"] * seasonal * noise)
        rows.append({
            "date": date.strftime("%Y-%m-%d"),
            "sku_id": cfg["sku_id"],
            "demand": round(demand, 2),
            "unit_cost": cfg["cost"],
            "lead_time": cfg["lead"],
        })

df = pd.DataFrame(rows)
df.to_csv(OUT, index=False)
print(f"Sample data saved → {OUT}")
print(df.groupby("sku_id")["demand"].agg(["mean","min","max"]).round(1))
