"""
Unified forecasting service. Tries LSTM first, falls back to ARIMA.
"""

import numpy as np
import os
from typing import Optional, Dict, Callable
from app.core.forecasting.lstm_forecaster import LSTMForecaster
from app.core.forecasting.arima_forecaster import ARIMAForecaster


MIN_LSTM_SAMPLES = 60  # need at least 60 days to train LSTM


class ForecastService:
    def __init__(self, models_dir: str = "models/lstm"):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)

    def forecast(
        self,
        sku_id: str,
        demand_history: np.ndarray,
        forecast_days: int = 30,
        progress_callback: Optional[Callable] = None,
        force_arima: bool = False,
    ) -> Dict:
        method = "arima"
        mae = rmse = None

        if len(demand_history) >= MIN_LSTM_SAMPLES and not force_arima:
            try:
                lstm = LSTMForecaster(epochs=30)
                train = demand_history[: int(len(demand_history) * 0.8)]
                test = demand_history[int(len(demand_history) * 0.8):]
                lstm.fit(train, progress_callback=progress_callback)
                metrics = lstm.evaluate(test)
                mae = metrics["mae"]
                rmse = metrics["rmse"]
                forecast, lower, upper = lstm.predict(demand_history, forecast_days)

                # Save model
                path = os.path.join(self.models_dir, f"{sku_id}_lstm.pt")
                lstm.save(path)
                method = "lstm"
            except Exception:
                method = "arima"

        if method == "arima":
            arima = ARIMAForecaster()
            arima.fit(demand_history)
            forecast, lower, upper = arima.predict(forecast_days)
            if len(demand_history) > 10:
                test = demand_history[-10:]
                metrics = arima.evaluate(test)
                mae = metrics["mae"]
                rmse = metrics["rmse"]

        return {
            "sku_id": sku_id,
            "method": method,
            "forecast_days": forecast_days,
            "predicted_demand": forecast.tolist(),
            "confidence_lower": lower.tolist(),
            "confidence_upper": upper.tolist(),
            "mae": mae,
            "rmse": rmse,
        }

    def load_lstm_forecasts(self, sku_ids: list, episode_length: int) -> Optional[np.ndarray]:
        """Load saved LSTM models and generate full-episode forecasts."""
        forecasts = np.zeros((episode_length, len(sku_ids)))
        all_loaded = True
        for i, sku_id in enumerate(sku_ids):
            path = os.path.join(self.models_dir, f"{sku_id}_lstm.pt")
            if not os.path.exists(path):
                all_loaded = False
                break
            try:
                lstm = LSTMForecaster()
                lstm.load(path)
                # Use synthetic seed for full-episode forecast
                dummy_history = np.random.default_rng(42).normal(80, 20, 100)
                fc, _, _ = lstm.predict(dummy_history, episode_length)
                forecasts[:, i] = fc
            except Exception:
                all_loaded = False
                break
        return forecasts if all_loaded else None
