"""
Forecasting endpoints — LSTM/ARIMA demand forecasts.
"""

import numpy as np
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.core.forecasting.forecast_service import ForecastService
from app.config import settings

router = APIRouter(prefix="/forecast", tags=["forecasting"])
_service = ForecastService(models_dir=str(settings.models_dir / "lstm"))


class ForecastRequest(BaseModel):
    sku_id: str
    demand_history: List[float]
    forecast_days: int = 30
    force_arima: bool = False


@router.post("/predict")
async def forecast_demand(req: ForecastRequest) -> Dict[str, Any]:
    if len(req.demand_history) < 10:
        raise HTTPException(400, "Need at least 10 days of history.")
    history = np.array(req.demand_history, dtype=float)
    result = _service.forecast(
        sku_id=req.sku_id,
        demand_history=history,
        forecast_days=req.forecast_days,
        force_arima=req.force_arima,
    )
    return result


@router.post("/upload-csv")
async def upload_demand_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Accept CSV (date,sku_id,demand,...) and run per-SKU forecasts."""
    import pandas as pd
    import io

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")

    required = {"date", "sku_id", "demand"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"CSV must have columns: {required}")

    df["demand"] = pd.to_numeric(df["demand"], errors="coerce").fillna(0)
    results = []
    for sku_id, group in df.groupby("sku_id"):
        history = group.sort_values("date")["demand"].values
        if len(history) < 10:
            continue
        r = _service.forecast(str(sku_id), history, forecast_days=30)
        results.append(r)

    return {"forecasts": results, "num_skus": len(results)}
