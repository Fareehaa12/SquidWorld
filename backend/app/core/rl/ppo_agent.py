"""
PPO agent wrapper around Stable-Baselines3.
Handles training, inference, and checkpoint save/load.

CRITICAL: VecNormalize stats must be saved and re-applied at inference time.
The policy was trained on normalized observations; passing raw obs breaks it.
"""

import os
import glob
import pickle
import numpy as np
import platform
from typing import Optional, Callable, Dict, Any

from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback, CheckpointCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import SubprocVecEnv, DummyVecEnv, VecNormalize
from stable_baselines3.common.running_mean_std import RunningMeanStd

from app.core.simulation.supply_chain_env import SupplyChainEnv


class MetricsCallback(BaseCallback):
    def __init__(self, log_interval=10_000, progress_callback=None, total_steps=1_000_000):
        super().__init__()
        self.log_interval = log_interval
        self.progress_callback = progress_callback
        self.total_steps = total_steps
        self.metrics: list = []

    def _on_step(self) -> bool:
        if self.n_calls % self.log_interval == 0:
            mean_rew = (
                float(np.mean([ep["r"] for ep in self.model.ep_info_buffer]))
                if self.model.ep_info_buffer else 0.0
            )
            self.metrics.append({"step": self.num_timesteps, "mean_reward": mean_rew})
            if self.progress_callback:
                pct = min(self.num_timesteps / self.total_steps * 100, 100)
                self.progress_callback(self.num_timesteps, self.total_steps, mean_rew, pct)
        return True


def make_env(config: Dict[str, Any], seed: int = 0):
    def _init():
        env = SupplyChainEnv(**config, seed=seed)
        return Monitor(env)
    return _init


class PPOAgent:
    def __init__(self, checkpoints_dir="checkpoints/ppo_v10", n_envs=4, device="auto"):
        self.checkpoints_dir = checkpoints_dir
        self.n_envs = n_envs
        self.device = device
        self.model: Optional[PPO] = None
        self._obs_rms: Optional[RunningMeanStd] = None  # saved normalisation stats
        os.makedirs(checkpoints_dir, exist_ok=True)

    # ------------------------------------------------------------------
    def train(self, env_config, total_timesteps=1_000_000, progress_callback=None):
        VecClass = DummyVecEnv if platform.system() == "Windows" else SubprocVecEnv
        envs = VecClass([make_env(env_config, seed=i) for i in range(self.n_envs)])
        # norm_obs=False: all obs features are already in [0,1] by design in _get_obs().
        # Keeping obs un-normalised eliminates training/inference distribution mismatch
        # (RunningMeanStd drifts toward high-stock mean, making initial states look OOD).
        envs = VecNormalize(envs, norm_obs=False, norm_reward=True, clip_obs=10.0)

        if self.model is not None:
            self.model.set_env(envs)
        else:
            self.model = PPO(
                "MlpPolicy", envs,
                learning_rate=3e-4, n_steps=2048, batch_size=128,
                n_epochs=10, gamma=0.99, gae_lambda=0.95,
                clip_range=0.2, ent_coef=0.01, verbose=0,
                device=self.device,
                tensorboard_log=os.path.join(self.checkpoints_dir, "tb_logs"),
            )

        metrics_cb = MetricsCallback(10_000, progress_callback, total_timesteps)
        self.model.learn(
            total_timesteps=total_timesteps,
            callback=[
                metrics_cb,
                CheckpointCallback(100_000, self.checkpoints_dir, "ppo_squid", verbose=0),
            ],
            progress_bar=False,
        )

        self.save("final")
        # norm_obs=False: no obs_rms needed at inference.
        vn_path = os.path.join(self.checkpoints_dir, "vec_normalize.pkl")
        envs.save(vn_path)
        self._obs_rms = None  # raw [0,1] obs used at inference too

        return {"metrics": metrics_cb.metrics}

    # ------------------------------------------------------------------
    def _normalize_obs(self, obs: np.ndarray) -> np.ndarray:
        """Apply saved VecNormalize stats to a raw observation."""
        if self._obs_rms is None:
            return obs
        normed = (obs - self._obs_rms.mean) / np.sqrt(self._obs_rms.var + 1e-8)
        return np.clip(normed, -10.0, 10.0).astype(np.float32)

    def predict(self, obs: np.ndarray, deterministic: bool = True) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("No model loaded.")
        obs_norm = self._normalize_obs(obs)
        action, _ = self.model.predict(obs_norm, deterministic=deterministic)
        return action

    # ------------------------------------------------------------------
    def save(self, tag="final"):
        self.model.save(os.path.join(self.checkpoints_dir, f"ppo_squid_{tag}"))

    def load(self, tag="final") -> bool:
        path = os.path.join(self.checkpoints_dir, f"ppo_squid_{tag}.zip")
        if not os.path.exists(path):
            return False
        self.model = PPO.load(path, device=self.device)
        # Load obs normalisation stats if available
        rms_path = os.path.join(self.checkpoints_dir, "obs_rms.pkl")
        if os.path.exists(rms_path):
            with open(rms_path, "rb") as f:
                self._obs_rms = pickle.load(f)
        else:
            self._obs_rms = None
        return True

    def load_best(self) -> bool:
        if self.load("final"):
            return True
        files = sorted(
            glob.glob(os.path.join(self.checkpoints_dir, "ppo_squid_*.zip")),
            key=os.path.getmtime, reverse=True,
        )
        for f in files:
            tag = os.path.basename(f).replace("ppo_squid_", "").replace(".zip", "")
            if self.load(tag):
                return True
        return False
