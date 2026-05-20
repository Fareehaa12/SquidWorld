"""
Lightweight LSTM demand forecaster.
Architecture: 2-layer LSTM (50 units) → Dense(1).
Trains per-SKU or multi-SKU with a shared model.
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Optional, Tuple
import os


class LSTMModel(nn.Module):
    def __init__(self, input_size: int = 1, hidden: int = 50, layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden, layers, batch_first=True, dropout=0.1)
        self.fc = nn.Linear(hidden, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, features)
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :]).squeeze(-1)


class LSTMForecaster:
    def __init__(
        self,
        seq_len: int = 30,
        hidden: int = 50,
        layers: int = 2,
        epochs: int = 30,
        lr: float = 1e-3,
        device: Optional[str] = None,
    ):
        self.seq_len = seq_len
        self.hidden = hidden
        self.layers = layers
        self.epochs = epochs
        self.lr = lr
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[LSTMModel] = None
        self._mean: float = 0.0
        self._std: float = 1.0

    # ------------------------------------------------------------------
    def _prepare_sequences(
        self, data: np.ndarray
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        xs, ys = [], []
        for i in range(len(data) - self.seq_len):
            xs.append(data[i: i + self.seq_len])
            ys.append(data[i + self.seq_len])
        X = torch.tensor(np.array(xs), dtype=torch.float32).unsqueeze(-1)
        y = torch.tensor(np.array(ys), dtype=torch.float32)
        return X, y

    # ------------------------------------------------------------------
    def fit(
        self,
        demand_series: np.ndarray,
        progress_callback=None,
    ) -> dict:
        """Train on a 1-D demand series. Returns training metrics."""
        self._mean = demand_series.mean()
        self._std = demand_series.std() + 1e-8
        normed = (demand_series - self._mean) / self._std

        X, y = self._prepare_sequences(normed)
        dataset = TensorDataset(X, y)
        loader = DataLoader(dataset, batch_size=32, shuffle=True)

        self.model = LSTMModel(1, self.hidden, self.layers).to(self.device)
        opt = torch.optim.Adam(self.model.parameters(), lr=self.lr)
        criterion = nn.MSELoss()

        history = []
        self.model.train()
        for ep in range(self.epochs):
            ep_loss = 0.0
            for xb, yb in loader:
                xb, yb = xb.to(self.device), yb.to(self.device)
                opt.zero_grad()
                pred = self.model(xb)
                loss = criterion(pred, yb)
                loss.backward()
                opt.step()
                ep_loss += loss.item()
            avg = ep_loss / len(loader)
            history.append(avg)
            if progress_callback:
                progress_callback(ep + 1, self.epochs, avg)

        return {"train_losses": history, "final_loss": history[-1]}

    # ------------------------------------------------------------------
    def predict(self, history: np.ndarray, steps: int = 30) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Predict `steps` future values using autoregressive rollout.
        Returns (forecast, lower_ci, upper_ci).
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Call fit() first.")

        normed = (history - self._mean) / self._std
        seq = list(normed[-self.seq_len:])

        self.model.eval()
        preds = []
        with torch.no_grad():
            for _ in range(steps):
                x = torch.tensor(seq[-self.seq_len:], dtype=torch.float32)
                x = x.unsqueeze(0).unsqueeze(-1).to(self.device)
                p = self.model(x).item()
                preds.append(p)
                seq.append(p)

        preds = np.array(preds)
        forecast = preds * self._std + self._mean
        forecast = np.clip(forecast, 0, None)

        # Simple confidence interval from training std
        noise = self._std * 0.3
        lower = np.clip(forecast - 1.96 * noise, 0, None)
        upper = forecast + 1.96 * noise
        return forecast, lower, upper

    # ------------------------------------------------------------------
    def save(self, path: str):
        if self.model is None:
            raise RuntimeError("No model to save.")
        torch.save({
            "model_state": self.model.state_dict(),
            "mean": self._mean,
            "std": self._std,
            "seq_len": self.seq_len,
            "hidden": self.hidden,
            "layers": self.layers,
        }, path)

    def load(self, path: str):
        ckpt = torch.load(path, map_location=self.device)
        self._mean = ckpt["mean"]
        self._std = ckpt["std"]
        self.seq_len = ckpt["seq_len"]
        self.hidden = ckpt["hidden"]
        self.layers = ckpt["layers"]
        self.model = LSTMModel(1, self.hidden, self.layers).to(self.device)
        self.model.load_state_dict(ckpt["model_state"])
        self.model.eval()

    # ------------------------------------------------------------------
    def evaluate(self, test_series: np.ndarray) -> dict:
        """Compute MAE and RMSE on a held-out test set."""
        if len(test_series) <= self.seq_len:
            return {"mae": None, "rmse": None}
        normed = (test_series - self._mean) / self._std
        X, y_true = self._prepare_sequences(normed)
        self.model.eval()
        with torch.no_grad():
            y_pred = self.model(X.to(self.device)).cpu().numpy()
        y_true = y_true.numpy()
        mae = np.abs(y_pred - y_true).mean() * self._std
        rmse = np.sqrt(((y_pred - y_true) ** 2).mean()) * self._std
        return {"mae": float(mae), "rmse": float(rmse)}
