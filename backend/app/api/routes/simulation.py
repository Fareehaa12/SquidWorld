"""
Simulation endpoints — run full episodes, stream step-by-step.
"""

import asyncio
import json
import uuid
import numpy as np
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from app.models.schemas import SimulationConfig
from app.core.simulation.supply_chain_env import SupplyChainEnv
from app.core.rl.ppo_agent import PPOAgent
from app.core.forecasting.forecast_service import ForecastService
from app.core.analytics.cost_analytics import (
    compute_baseline_metrics,
    build_savings_report,
    generate_time_series_chart_data,
)
from app.config import settings

router = APIRouter(prefix="/simulation", tags=["simulation"])

# In-memory store for active simulations
_active: Dict[str, Dict] = {}


def _build_env_config(cfg: SimulationConfig) -> Dict[str, Any]:
    return {
        "num_skus": cfg.num_skus,
        "episode_length": cfg.simulation_days,
        "demand_pattern": cfg.demand_pattern,
        "demand_volatility": cfg.demand_volatility,
        "seasonal_amplitude": cfg.seasonal_amplitude,
        "supply_disruption_prob": cfg.supply_disruption_prob,
        "sku_configs": [s.model_dump() for s in cfg.skus] if cfg.skus else None,
        "seed": cfg.seed,
    }


@router.post("/run")
async def run_simulation(cfg: SimulationConfig) -> Dict[str, Any]:
    """Run a complete episode and return full analytics."""
    env_cfg = _build_env_config(cfg)
    env = SupplyChainEnv(**env_cfg)
    obs, _ = env.reset()

    import numpy as np

    agent = PPOAgent(checkpoints_dir=str(settings.checkpoints_dir / "ppo_v10"))
    loaded = agent.load_best()
    # Only use PPO if its obs space matches the current env's obs space
    use_ppo = (
        loaded
        and agent.model is not None
        and agent.model.observation_space.shape[0] == obs.shape[0]
    )

    done = False
    while not done:
        if use_ppo:
            action = agent.predict(obs)
        else:
            # Heuristic fallback: order if stock < 2× lead-time demand
            action = []
            for i, sku in enumerate(env.skus):
                avg_d = env.demand_history[:env.current_day, i].mean() if env.current_day > 0 else 80
                threshold = avg_d * sku.lead_time_days * 2
                if sku.stock < threshold:
                    action.append(2)  # bin 2 = 100 units
                else:
                    action.append(0)
            action = np.array(action)

        obs, _, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

    summary = env.get_episode_summary()
    chart_data = generate_time_series_chart_data(env.step_log)

    sku_cfgs = [
        {
            "sku_id": s.sku_id,
            "holding_cost_per_day": s.holding_cost_per_day,
            "ordering_cost": s.ordering_cost,
            "unit_cost": s.unit_cost,
            "stockout_penalty": s.stockout_penalty,
        }
        for s in env.skus
    ]
    avg_demands = [
        env.demand_history[:, i].mean() for i in range(cfg.num_skus)
    ]
    baseline_metrics = compute_baseline_metrics(sku_cfgs, avg_demands, cfg.simulation_days)
    savings_report = build_savings_report(summary, baseline_metrics, settings.currency_symbol)

    return {
        "summary": summary,
        "savings_report": savings_report,
        "chart_data": chart_data,
        "sku_configs": sku_cfgs,
        "policy": "ppo" if use_ppo else "heuristic",
    }


@router.post("/run-with-forecasts")
async def run_with_user_forecasts(
    cfg: SimulationConfig,
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    """
    Mode 2: Upload CSV, train LSTM per SKU, run simulation using LSTM forecasts.
    """
    import pandas as pd, io

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"Cannot parse CSV: {e}")

    required = {"date", "sku_id", "demand"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"CSV must have columns: {required}")

    df["demand"] = pd.to_numeric(df["demand"], errors="coerce").fillna(0)

    svc = ForecastService(models_dir=str(settings.models_dir / "lstm"))
    sku_ids = df["sku_id"].unique().tolist()[: cfg.num_skus]
    episode_len = cfg.simulation_days

    # Build LSTM forecasts for each SKU
    lstm_matrix = np.zeros((episode_len, len(sku_ids)))
    forecasts_meta = []
    for i, sku_id in enumerate(sku_ids):
        history = df[df["sku_id"] == sku_id].sort_values("date")["demand"].values
        result = svc.forecast(str(sku_id), history, forecast_days=episode_len)
        lstm_matrix[:, i] = np.array(result["predicted_demand"])[:episode_len]
        forecasts_meta.append(result)

    env_cfg = _build_env_config(cfg)
    env = SupplyChainEnv(**env_cfg, lstm_forecasts=lstm_matrix)
    obs, _ = env.reset()

    agent = PPOAgent(checkpoints_dir=str(settings.checkpoints_dir / "ppo_v10"))
    loaded = agent.load_best()
    use_ppo = (
        loaded
        and agent.model is not None
        and agent.model.observation_space.shape[0] == obs.shape[0]
    )

    done = False
    while not done:
        if use_ppo:
            action = agent.predict(obs)
        else:
            action_list = []
            for i, sku in enumerate(env.skus):
                avg_d = env.demand_history[:env.current_day, i].mean() if env.current_day > 0 else 80
                threshold = avg_d * sku.lead_time_days * 2
                action_list.append(2 if sku.stock < threshold else 0)
            action = np.array(action_list)
        obs, _, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

    summary = env.get_episode_summary()
    chart_data = generate_time_series_chart_data(env.step_log)
    sku_cfgs = [
        {"sku_id": s.sku_id, "holding_cost_per_day": s.holding_cost_per_day,
         "ordering_cost": s.ordering_cost, "unit_cost": s.unit_cost,
         "stockout_penalty": s.stockout_penalty}
        for s in env.skus
    ]
    avg_demands = [env.demand_history[:, i].mean() for i in range(len(sku_ids))]
    baseline_metrics = compute_baseline_metrics(sku_cfgs, avg_demands, cfg.simulation_days)
    savings_report = build_savings_report(summary, baseline_metrics, settings.currency_symbol)

    return {
        "summary": summary,
        "savings_report": savings_report,
        "chart_data": chart_data,
        "forecasts": forecasts_meta,
        "policy": "ppo+lstm" if use_ppo else "heuristic+lstm",
    }


@router.post("/stream/create")
async def create_stream_session(cfg: SimulationConfig) -> Dict[str, str]:
    """Create a streaming simulation session, return session ID."""
    sim_id = str(uuid.uuid4())
    _active[sim_id] = {"config": cfg, "status": "ready"}
    return {"sim_id": sim_id}


@router.get("/stream/{sim_id}")
async def stream_simulation(sim_id: str):
    """SSE stream: push each day's step data as JSON."""
    if sim_id not in _active:
        raise HTTPException(404, "Session not found")

    session = _active[sim_id]
    cfg: SimulationConfig = session["config"]
    env_cfg = _build_env_config(cfg)

    async def event_generator():
        env = SupplyChainEnv(**env_cfg)
        obs, _ = env.reset()

        import numpy as np

        agent = PPOAgent(checkpoints_dir=str(settings.checkpoints_dir / "ppo_v10"))
        loaded = agent.load_best()
        use_ppo = (
            loaded
            and agent.model is not None
            and agent.model.observation_space.shape[0] == obs.shape[0]
        )

        done = False
        while not done:
            if use_ppo:
                action = agent.predict(obs)
            else:
                action = np.array([2] * cfg.num_skus)

            obs, reward, terminated, truncated, info = env.step(action)
            done = terminated or truncated

            payload = json.dumps({
                "day": env.current_day,
                "reward": round(float(reward), 2),
                "steps": info["log"],
            })
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.05)  # 50ms per day → ~18s for 365 days

        summary = env.get_episode_summary()
        yield f"data: {json.dumps({'done': True, 'summary': summary})}\n\n"
        _active.pop(sim_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
