# coding: utf-8
"""
SQUID Training Results Plotter
Reads checkpoints/ppo/training_metrics.json and generates:
  - reward_curve.png        : PPO mean reward over training steps
  - scenario_comparison.png : per-scenario final reward bar chart
  - ppo_vs_baseline.png     : live episode comparison after training

Run: python -m training.plot_results
"""

import sys, os, json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.config import settings
from app.core.simulation.supply_chain_env import SupplyChainEnv
from app.core.rl.ppo_agent import PPOAgent

CHART_DIR    = str(settings.checkpoints_dir / "ppo_v10" / "charts")
METRICS_PATH = str(settings.checkpoints_dir / "ppo_v10" / "training_metrics.json")
os.makedirs(CHART_DIR, exist_ok=True)

TEAL   = "#00b4d8"
PURPLE = "#7b2fff"
AMBER  = "#ffb703"
GREEN  = "#2dc653"
CORAL  = "#ff6b6b"
BG     = "#0d1b2a"
GRID   = "#1b3a5c"


def set_style(ax, title):
    ax.set_facecolor(BG)
    ax.tick_params(colors="#94a3b8", labelsize=9)
    for spine in ax.spines.values():
        spine.set_color(GRID)
    ax.grid(color=GRID, linewidth=0.6, linestyle="--")
    ax.set_title(title, color=TEAL, fontsize=11, fontweight="bold", pad=10)
    ax.xaxis.label.set_color("#94a3b8")
    ax.yaxis.label.set_color("#94a3b8")


# -- 1. Reward curve ----------------------------------------------------------
def plot_reward_curve(metrics):
    steps   = [m["step"]        for m in metrics]
    rewards = [m["mean_reward"] for m in metrics]

    fig, ax = plt.subplots(figsize=(10, 4), facecolor=BG)
    ax.plot(steps, rewards, color=TEAL, linewidth=1.5, alpha=0.4)

    window = max(1, len(rewards) // 20)
    smooth = np.convolve(rewards, np.ones(window) / window, mode="valid")
    ax.plot(steps[:len(smooth)], smooth, color=TEAL, linewidth=2.5, label="Smoothed reward")
    ax.fill_between(steps[:len(smooth)], smooth, alpha=0.12, color=TEAL)

    ax.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"Rs{v/1e6:.0f}M"))
    ax.set_xlabel("Training Step")
    ax.set_ylabel("Mean Episode Reward (PKR)")
    set_style(ax, "PPO Training Reward Curve -- SQUID")
    ax.legend(facecolor=BG, edgecolor=GRID, labelcolor="#e2e8f0", fontsize=9)

    plt.tight_layout()
    out = os.path.join(CHART_DIR, "reward_curve.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close()
    print(f"  Saved -> {out}")


# -- 2. Scenario comparison ---------------------------------------------------
def plot_scenario_comparison(metrics):
    chunk = max(1, len(metrics) // 8)
    labels = [
        "Rnd-Low", "Rnd-Med", "Rnd-High",
        "Sea-Low", "Sea-Med", "Sea-High",
        "Sea-High-D", "Rnd-Disrupt",
    ]
    scenarios = []
    for i in range(8):
        seg = metrics[i * chunk: (i + 1) * chunk]
        if seg:
            scenarios.append(np.mean([m["mean_reward"] for m in seg]))

    fig, ax = plt.subplots(figsize=(10, 4), facecolor=BG)
    colors = [TEAL if v == max(scenarios) else PURPLE for v in scenarios]
    bars = ax.bar(labels[:len(scenarios)], scenarios, color=colors,
                  edgecolor=GRID, linewidth=0.5)
    ax.bar_label(bars, fmt=lambda v: f"Rs{v/1e6:.0f}M", padding=4,
                 color="#e2e8f0", fontsize=8)
    ax.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"Rs{v/1e6:.0f}M"))
    ax.set_xlabel("Scenario")
    ax.set_ylabel("Mean Reward (PKR)")
    set_style(ax, "Mean Reward per Training Scenario")
    plt.xticks(rotation=20)
    plt.tight_layout()
    out = os.path.join(CHART_DIR, "scenario_comparison.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close()
    print(f"  Saved -> {out}")


# -- 3. Live PPO vs Naive (s,Q) comparison ------------------------------------
def plot_ppo_vs_baseline(checkpoints_dir=None):
    import math
    from app.core.simulation.supply_chain_env import ORDER_BINS

    env_cfg = dict(
        num_skus=10, episode_length=365,
        demand_pattern="seasonal", demand_volatility="high",
        supply_disruption_prob=0.25, seed=42,
    )

    # -- Run PPO episode --
    env_ppo = SupplyChainEnv(**env_cfg)
    obs, _ = env_ppo.reset()
    agent = PPOAgent(checkpoints_dir=checkpoints_dir or str(settings.checkpoints_dir / "ppo_v10"))
    use_ppo = agent.load_best()
    done = False
    ppo_daily = []
    while not done:
        if use_ppo and agent.model.observation_space.shape[0] == obs.shape[0]:
            action = agent.predict(obs)
        else:
            action = np.array([2] * 10)
        obs, reward, terminated, truncated, _ = env_ppo.step(action)
        ppo_daily.append(reward)
        done = terminated or truncated

    summary = env_ppo.get_episode_summary()
    ppo_net = summary["net_profit"]
    baseline_net = summary["baseline_profit"]

    ppo_cum = np.cumsum(ppo_daily)
    baseline_cum = np.linspace(0, baseline_net, len(ppo_cum))
    days = np.arange(1, len(ppo_cum) + 1)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), facecolor=BG)

    ax1.plot(days, ppo_cum / 1e6, color=TEAL,   linewidth=2, label="PPO Agent")
    ax1.plot(days, baseline_cum / 1e6, color=PURPLE, linewidth=2,
             label="Naive (s,Q) Baseline", linestyle="--")
    ax1.fill_between(days, ppo_cum / 1e6, baseline_cum / 1e6,
                     where=ppo_cum > baseline_cum, alpha=0.15, color=GREEN, label="PPO advantage")
    ax1.fill_between(days, ppo_cum / 1e6, baseline_cum / 1e6,
                     where=ppo_cum < baseline_cum, alpha=0.15, color=CORAL, label="Baseline advantage")
    ax1.set_xlabel("Day")
    ax1.set_ylabel("Cumulative Profit (Rs M)")
    ax1.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"Rs{v:.0f}M"))
    ax1.legend(facecolor=BG, edgecolor=GRID, labelcolor="#e2e8f0", fontsize=9)
    set_style(ax1, "Cumulative Profit: PPO vs Naive (s,Q)")

    ppo_m      = ppo_net / 1e6
    baseline_m = baseline_net / 1e6
    diff_pct = (ppo_m - baseline_m) / abs(baseline_m) * 100 if baseline_m != 0 else 0
    sign = "+" if diff_pct >= 0 else ""

    bars = ax2.bar(
        ["Naive (s,Q)", "PPO Agent"],
        [baseline_m, ppo_m],
        color=[PURPLE, TEAL], edgecolor=GRID, linewidth=0.5, width=0.5,
    )
    ax2.bar_label(bars, fmt=lambda v: f"Rs{v:.1f}M", padding=6,
                  color="#e2e8f0", fontsize=10, fontweight="bold")
    ax2.set_ylabel("Net Profit (Rs M)")
    ax2.yaxis.set_major_formatter(mtick.FuncFormatter(lambda v, _: f"Rs{v:.0f}M"))
    set_style(ax2, f"Final Result -- PPO {sign}{diff_pct:.1f}% vs Naive (s,Q)")

    plt.suptitle("SQUID -- PPO vs Naive (s,Q) Baseline (10 SKUs, 365 Days, PKR)", color=AMBER,
                 fontsize=13, fontweight="bold", y=1.02)
    plt.tight_layout()
    out = os.path.join(CHART_DIR, "ppo_vs_baseline.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close()
    print(f"  Saved -> {out}")

    print(f"\n  PPO net profit          : Rs {ppo_m:.2f}M")
    print(f"  Naive (s,Q) net profit  : Rs {baseline_m:.2f}M")
    print(f"  PPO advantage           : {sign}{diff_pct:.1f}%")
    return ppo_net > baseline_net


if __name__ == "__main__":
    print("=" * 55)
    print("  SQUID Results Plotter")
    print(f"  Charts -> {CHART_DIR}")
    print("=" * 55)

    if not os.path.exists(METRICS_PATH):
        print("  training_metrics.json not found -- run train_ppo.py first.")
        sys.exit(1)

    with open(METRICS_PATH) as f:
        metrics = json.load(f)

    print(f"\n[1/3] Reward curve ({len(metrics)} data points)...")
    plot_reward_curve(metrics)

    print("[2/3] Scenario comparison...")
    plot_scenario_comparison(metrics)

    print("[3/3] Live PPO vs Naive (s,Q) episode...")
    beats = plot_ppo_vs_baseline()

    print(f"\n{'PPO BEATS BASELINE' if beats else 'PPO trails baseline -- needs more training'}")
    print("Done.")
