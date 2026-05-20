"""
Training endpoints — start PPO training jobs, poll status.
"""

import asyncio
import uuid
import threading
from typing import Dict, Any
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.schemas import SimulationConfig, TrainingStatus
from app.core.rl.ppo_agent import PPOAgent
from app.config import settings

router = APIRouter(prefix="/training", tags=["training"])

_jobs: Dict[str, Dict[str, Any]] = {}


def _run_training(job_id: str, env_config: Dict, total_timesteps: int):
    job = _jobs[job_id]
    job["status"] = "running"

    def progress_cb(step, total, mean_rew, pct):
        job["current_step"] = step
        job["progress_pct"] = pct
        job["mean_reward"] = round(mean_rew, 2)
        job["message"] = f"Step {step:,}/{total:,} — reward: {mean_rew:.1f}"

    try:
        agent = PPOAgent(
            checkpoints_dir=str(settings.checkpoints_dir / "ppo_v10"),
            n_envs=settings.n_envs,
        )
        result = agent.train(env_config, total_timesteps, progress_cb)
        job["status"] = "completed"
        job["progress_pct"] = 100.0
        job["metrics"] = result["metrics"]
        job["message"] = "Training complete. Model saved."
    except Exception as e:
        job["status"] = "failed"
        job["message"] = str(e)


@router.post("/start")
async def start_training(cfg: SimulationConfig) -> Dict[str, str]:
    job_id = str(uuid.uuid4())
    env_config = {
        "num_skus": cfg.num_skus,
        "episode_length": cfg.simulation_days,
        "demand_pattern": cfg.demand_pattern,
        "demand_volatility": cfg.demand_volatility,
        "seasonal_amplitude": cfg.seasonal_amplitude,
        "supply_disruption_prob": cfg.supply_disruption_prob,
    }
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress_pct": 0.0,
        "current_step": 0,
        "total_steps": settings.total_timesteps,
        "mean_reward": None,
        "message": "Queued",
    }
    t = threading.Thread(
        target=_run_training,
        args=(job_id, env_config, settings.total_timesteps),
        daemon=True,
    )
    t.start()
    return {"job_id": job_id}


@router.get("/status/{job_id}", response_model=TrainingStatus)
async def get_training_status(job_id: str) -> TrainingStatus:
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    j = _jobs[job_id]
    return TrainingStatus(
        job_id=job_id,
        status=j["status"],
        progress_pct=j["progress_pct"],
        current_step=j["current_step"],
        total_steps=j["total_steps"],
        mean_reward=j.get("mean_reward"),
        message=j["message"],
    )


@router.get("/jobs")
async def list_jobs() -> list:
    return list(_jobs.values())
