"""
ARIMA fallback forecaster (used when LSTM training fails or data is too short).
Auto-selects (p,d,q) via AIC grid search.
"""

import numpy as np
from typing import Tuple, Optional


class ARIMAForecaster:
    def __init__(self):
        self.model_fit = None
        self._mean: float = 0.0

    def fit(self, demand_series: np.ndarray) -> dict:
        from statsmodels.tsa.arima.model import ARIMA
        import warnings

        self._mean = demand_series.mean()
        best_aic = np.inf
        best_order = (1, 1, 1)

        for p in range(3):
            for d in range(2):
                for q in range(3):
                    try:
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore")
                            m = ARIMA(demand_series, order=(p, d, q)).fit()
                        if m.aic < best_aic:
                            best_aic = m.aic
                            best_order = (p, d, q)
                    except Exception:
                        continue

        from statsmodels.tsa.arima.model import ARIMA
        with np.errstate(all="ignore"):
            self.model_fit = ARIMA(demand_series, order=best_order).fit()

        return {"order": best_order, "aic": best_aic}

    def predict(self, steps: int = 30) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.model_fit is None:
            raise RuntimeError("Model not fitted.")
        forecast_res = self.model_fit.get_forecast(steps=steps)
        mean = forecast_res.predicted_mean
        ci = forecast_res.conf_int(alpha=0.05)
        lower = np.clip(ci.iloc[:, 0].values, 0, None)
        upper = ci.iloc[:, 1].values
        forecast = np.clip(mean.values, 0, None)
        return forecast, lower, upper

    def evaluate(self, test_series: np.ndarray) -> dict:
        if self.model_fit is None:
            return {"mae": None, "rmse": None}
        steps = len(test_series)
        fc, _, _ = self.predict(steps)
        mae = float(np.abs(fc - test_series).mean())
        rmse = float(np.sqrt(((fc - test_series) ** 2).mean()))
        return {"mae": mae, "rmse": rmse}
