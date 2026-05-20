"""
Generates per-SKU daily demand with multiple patterns.
Supports: random, seasonal, trending.
"""

import numpy as np
from typing import Optional


VOLATILITY_MAP = {"low": 0.1, "medium": 0.25, "high": 0.5}

BASE_DEMANDS = [80, 60, 120, 45, 95, 70, 110, 55, 85, 100]


class DemandGenerator:
    def __init__(
        self,
        num_skus: int = 10,
        pattern: str = "random",
        volatility: str = "medium",
        seasonal_amplitude: float = 0.3,
        seed: Optional[int] = None,
    ):
        self.num_skus = num_skus
        self.pattern = pattern
        self.vol = VOLATILITY_MAP.get(volatility, 0.25)
        self.seasonal_amplitude = seasonal_amplitude
        self.base = np.array(BASE_DEMANDS[:num_skus], dtype=float)
        self._rng = np.random.default_rng(seed)
        self._trend_slopes = self._rng.uniform(-0.05, 0.15, num_skus)

    def reset(self):
        pass  # stateless generator, no reset needed

    def generate(self, day: int) -> np.ndarray:
        noise = 1.0 + self._rng.normal(0, self.vol, self.num_skus)
        noise = np.clip(noise, 0.1, 3.0)

        if self.pattern == "seasonal":
            # Annual cycle + weekly sub-cycle
            annual = 1.0 + self.seasonal_amplitude * np.sin(2 * np.pi * day / 365)
            weekly = 1.0 + 0.1 * np.sin(2 * np.pi * day / 7)
            demand = self.base * annual * weekly * noise
        elif self.pattern == "trending":
            trend = 1.0 + self._trend_slopes * (day / 365)
            demand = self.base * trend * noise
        else:
            demand = self.base * noise

        return np.clip(demand, 0, None).astype(float)
