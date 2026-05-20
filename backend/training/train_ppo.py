# coding: utf-8
"""
SQUID PPO Training Script
Trains on 1M steps across diverse synthetic scenarios (Option A base + Option C readiness).
Run: python -m training.train_ppo

Logged metrics -> checkpoints/ppo/tb_logs (TensorBoard)
Checkpoints    -> checkpoints/ppo/
"""

import sys
import os
import json
import time
import argparse
import numpy as np
import multiprocessing

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.rl.ppo_agent import PPOAgent
from app.config import settings


DIVERSE_SCENARIOS = [
    {"demand_pattern": "random",   "demand_volatility": "low",    "supply_disruption_prob": 0.02},
    {"demand_pattern": "random",   "demand_volatility": "medium", "supply_disruption_prob": 0.05},
    {"demand_pattern": "random",   "demand_volatility": "high",   "supply_disruption_prob": 0.10},
    {"demand_pattern": "seasonal", "demand_volatility": "low",    "supply_disruption_prob": 0.02},
    {"demand_pattern": "seasonal", "demand_volatility": "medium", "supply_disruption_prob": 0.05},
    {"demand_pattern": "seasonal", "demand_volatility": "high",   "supply_disruption_prob": 0.15},
    {"demand_pattern": "seasonal", "demand_volatility": "high",   "supply_disruption_prob": 0.10},
    {"demand_pattern": "random",   "demand_volatility": "medium", "supply_disruption_prob": 0.25},
]


def build_env_config(scenario: dict, num_skus: int = 10) -> dict:
    return {
        "num_skus": num_skus,
        "episode_length": 365,
        "seasonal_amplitude": 0.35,
        **scenario,
    }


def train(args):
    run_dir = str(settings.checkpoints_dir / args.run_name)
    print("=" * 60)
    print(f"  SQUID PPO Training -- {args.total_steps//1_000_000}M Steps")
    print(f"  Run name    -> {args.run_name}")
    print(f"  Checkpoints -> {run_dir}")
    print(f"  Fresh start -> {args.fresh}")
    print("=" * 60)

    steps_per_scenario = args.total_steps // len(DIVERSE_SCENARIOS)
    all_metrics = []

    for idx, scenario in enumerate(DIVERSE_SCENARIOS):
        print(f"\n[Scenario {idx+1}/{len(DIVERSE_SCENARIOS)}] {scenario}")
        env_config = build_env_config(scenario, num_skus=args.num_skus)
        agent = PPOAgent(
            checkpoints_dir=run_dir,
            n_envs=args.n_envs,
        )

        if idx == 0 and args.fresh:
            print("  Fresh start -- no checkpoint loaded.")
        else:
            loaded = agent.load_best()
            if loaded:
                print("  Resuming from checkpoint.")
            else:
                print("  No prior checkpoint -- starting fresh.")

        start = time.time()

        def progress_cb(step, total, mean_rew, pct):
            elapsed = time.time() - start
            eta = (elapsed / pct * (100 - pct)) if pct > 0 else 0
            print(
                f"  [{pct:5.1f}%] step={step:>8,}  reward={mean_rew:>10.1f}"
                f"  elapsed={elapsed:.0f}s  ETA={eta:.0f}s",
                flush=True,
            )

        result = agent.train(env_config, steps_per_scenario, progress_cb)
        all_metrics.extend(result["metrics"])
        print(f"  Scenario done in {time.time()-start:.0f}s")

    metrics_path = os.path.join(run_dir, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\nMetrics saved -> {metrics_path}")
    print("Training complete.")

    print("\nGenerating reward charts...")
    try:
        from training.plot_results import plot_reward_curve, plot_scenario_comparison, plot_ppo_vs_baseline
        plot_reward_curve(all_metrics)
        plot_scenario_comparison(all_metrics)
        beats = plot_ppo_vs_baseline(checkpoints_dir=run_dir)
        print(f"{'PPO beats baseline' if beats else 'PPO trails baseline -- consider more training'}")
    except Exception as e:
        print(f"Chart generation skipped: {e}")


if __name__ == "__main__":
    multiprocessing.freeze_support()
    parser = argparse.ArgumentParser(description="Train SQUID PPO agent")
    parser.add_argument("--total-steps", type=int, default=settings.total_timesteps)
    parser.add_argument("--num-skus",    type=int, default=10)
    parser.add_argument("--n-envs",      type=int, default=settings.n_envs)
    parser.add_argument("--run-name",    type=str, default="ppo")
    parser.add_argument("--fresh",       action="store_true",
                        help="Start from random weights, ignore existing checkpoints")
    args = parser.parse_args()
    train(args)
