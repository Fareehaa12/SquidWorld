"""
SQUID LSTM Pre-training Script
Generates synthetic demand data for all 10 SKUs across multiple patterns,
trains one LSTM per SKU, saves weights to models/lstm/.

Run: python -m training.train_lstm
"""

import sys
import os
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.simulation.demand_generator import DemandGenerator
from app.core.forecasting.lstm_forecaster import LSTMForecaster
from app.config import settings

PATTERNS = ["random", "seasonal", "trending"]
TRAIN_DAYS = 730  # 2 years synthetic data


def generate_combined_data(sku_idx: int, num_skus: int = 10) -> np.ndarray:
    """Blend 3 patterns to create diverse training data per SKU."""
    segments = []
    for pat in PATTERNS:
        gen = DemandGenerator(num_skus, pattern=pat, volatility="medium", seed=sku_idx * 13 + hash(pat) % 100)
        seg = np.array([gen.generate(d)[sku_idx] for d in range(TRAIN_DAYS // len(PATTERNS))])
        segments.append(seg)
    return np.concatenate(segments)


def train_all(num_skus: int = 10):
    lstm_dir = str(settings.models_dir / "lstm")
    os.makedirs(lstm_dir, exist_ok=True)

    print("=" * 60)
    print("  SQUID LSTM Pre-training")
    print(f"  Output â†’ {lstm_dir}")
    print("=" * 60)

    for i in range(num_skus):
        sku_id = f"SKU-{i+1:02d}"
        print(f"\n[{i+1}/{num_skus}] Training LSTM for {sku_id}...")

        data = generate_combined_data(i, num_skus)
        train = data[: int(len(data) * 0.8)]
        test = data[int(len(data) * 0.8):]

        lstm = LSTMForecaster(epochs=50, hidden=50, layers=2)

        def progress(ep, total, loss):
            if ep % 10 == 0 or ep == total:
                print(f"  Epoch {ep:3d}/{total}  loss={loss:.4f}", flush=True)

        lstm.fit(train, progress_callback=progress)
        metrics = lstm.evaluate(test)
        print(f"  MAE={metrics['mae']:.2f}  RMSE={metrics['rmse']:.2f}")

        path = os.path.join(lstm_dir, f"{sku_id}_lstm.pt")
        lstm.save(path)
        print(f"  Saved â†’ {path}")

    print("\nLSTM pre-training complete.")


if __name__ == "__main__":
    train_all(num_skus=10)

