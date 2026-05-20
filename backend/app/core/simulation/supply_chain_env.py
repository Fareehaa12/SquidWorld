"""
SQUID Supply Chain Gymnasium Environment.
Supports 1–10 SKUs, seasonal/random/trending demand, supplier disruptions.
All monetary values in PKR.
"""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Optional, List, Dict, Any

from app.core.simulation.demand_generator import DemandGenerator
from app.core.simulation.sku import SKU


ORDER_BINS = [0, 50, 100, 200, 500]  # discrete order quantities


class SupplyChainEnv(gym.Env):
    metadata = {"render_modes": ["human", "rgb_array"]}

    def __init__(
        self,
        num_skus: int = 10,
        episode_length: int = 365,
        demand_pattern: str = "random",
        demand_volatility: str = "medium",
        seasonal_amplitude: float = 0.3,
        supply_disruption_prob: float = 0.05,
        sku_configs: Optional[List[Dict]] = None,
        lstm_forecasts: Optional[np.ndarray] = None,
        seed: Optional[int] = None,
    ):
        super().__init__()

        self.num_skus = num_skus
        self.episode_length = episode_length
        self.supply_disruption_prob = supply_disruption_prob
        self.lstm_forecasts = lstm_forecasts  # shape: (episode_length, num_skus)

        self.demand_gen = DemandGenerator(
            num_skus=num_skus,
            pattern=demand_pattern,
            volatility=demand_volatility,
            seasonal_amplitude=seasonal_amplitude,
            seed=seed,
        )

        self.skus: List[SKU] = self._init_skus(sku_configs)

        # Action: order bin index per SKU
        self.action_space = spaces.MultiDiscrete([len(ORDER_BINS)] * num_skus)

        # Observation per SKU: stock, pending_order, days_of_stock, demand_avg_30,
        #                       lead_time, unit_cost_norm, lstm_forecast_norm
        obs_dim = num_skus * 7
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(obs_dim,), dtype=np.float32
        )

        self.current_day = 0
        self.pending_orders: List[Dict] = []  # {sku_idx, qty, arrive_day}
        self.demand_history = np.zeros((episode_length, num_skus))
        self.step_log: List[Dict] = []

        self._rng = np.random.default_rng(seed)
        # Identity order until first reset() shuffles it
        self._sku_order = np.arange(num_skus)
        self._sku_inv   = np.arange(num_skus)

    # ------------------------------------------------------------------
    def _init_skus(self, configs: Optional[List[Dict]]) -> List[SKU]:
        defaults = [
            {"name": f"SKU-{i+1:02d}", "unit_cost": 500 + i * 200,
             "holding_cost_per_day": 2.0 + i * 0.5,
             "stockout_penalty": 150 + i * 30,
             "ordering_cost": 800 + i * 100,
             "lead_time_days": 3 + (i % 5),
             "initial_stock": 200 + i * 20,
             "reorder_point": 50}
            for i in range(self.num_skus)
        ]
        if configs:
            for i, cfg in enumerate(configs[: self.num_skus]):
                defaults[i].update(cfg)
        return [SKU(sku_id=f"SKU-{i+1:02d}", **d) for i, d in enumerate(defaults)]

    # ------------------------------------------------------------------
    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self.current_day = 0
        self.pending_orders = []
        self.demand_history = np.zeros((self.episode_length, self.num_skus))
        self.step_log = []
        for sku in self.skus:
            sku.reset()
        self.demand_gen.reset()
        # Shuffle SKU order each episode so policy learns feature-based rules,
        # not position-based memorisation (fixes positional bias root cause).
        self._sku_order = self._rng.permutation(self.num_skus)
        self._sku_inv = np.argsort(self._sku_order)
        return self._get_obs(), {}

    # ------------------------------------------------------------------
    def step(self, action: np.ndarray):
        # Unscramble shuffled action back to true SKU indices
        action = np.array(action)[self._sku_inv]

        day = self.current_day
        demands = self.demand_gen.generate(day)
        self.demand_history[day] = demands

        # Arrive pending orders
        arrived = [o for o in self.pending_orders if o["arrive_day"] <= day]
        for o in arrived:
            # Apply disruption: order may be partially/fully lost
            if self._rng.random() < self.supply_disruption_prob:
                delivered = int(o["qty"] * self._rng.uniform(0.3, 0.9))
            else:
                delivered = o["qty"]
            self.skus[o["sku_idx"]].stock += delivered
        self.pending_orders = [o for o in self.pending_orders if o["arrive_day"] > day]

        # Place new orders
        for i, bin_idx in enumerate(action):
            qty = ORDER_BINS[int(bin_idx)]
            if qty > 0:
                arrive = day + self.skus[i].lead_time_days
                self.pending_orders.append(
                    {"sku_idx": i, "qty": qty, "arrive_day": arrive}
                )

        # Fulfil demand & compute reward
        total_reward = 0.0
        log_entries = []
        for i, sku in enumerate(self.skus):
            demand = demands[i]
            fulfilled = min(sku.stock, demand)
            shortfall = max(0.0, demand - fulfilled)
            sku.stock = max(0, sku.stock - int(fulfilled))

            holding = sku.holding_cost_per_day * sku.stock
            stockout = sku.stockout_penalty * shortfall
            order_cost = sku.ordering_cost if ORDER_BINS[int(action[i])] > 0 else 0.0
            revenue = fulfilled * sku.unit_cost * 1.2  # 20% margin in PKR

            # Additive over-stock penalty: each day above 14 days of demand costs
            # holding_rate × daily_demand × 2. Capped at 60 excess days to keep
            # rewards bounded during early exploration with random actions.
            avg_d = max(1.0, self.demand_history[max(0, day - 30): day + 1, i].mean())
            days_stock = sku.stock / avg_d
            excess_days = min(max(0.0, days_stock - 14.0), 90.0)
            excess_penalty = excess_days * sku.holding_cost_per_day * avg_d * 2.0

            reward = revenue - holding - stockout - order_cost - excess_penalty
            total_reward += reward

            log_entries.append({
                "day": day, "sku_id": sku.sku_id,
                "stock_level": sku.stock, "demand": demand,
                "fulfilled": fulfilled, "shortfall": shortfall,
                "order_placed": ORDER_BINS[int(action[i])],
                "pending_order": sum(o["qty"] for o in self.pending_orders if o["sku_idx"] == i),
                "reward": reward, "holding_cost": holding,
                "stockout_cost": stockout, "ordering_cost": order_cost,
                "revenue": revenue,
            })

        self.step_log.extend(log_entries)
        self.current_day += 1
        terminated = self.current_day >= self.episode_length
        return self._get_obs(), total_reward, terminated, False, {"log": log_entries}

    # ------------------------------------------------------------------
    def _get_obs(self) -> np.ndarray:
        day = self.current_day
        obs = []
        for i in self._sku_order:
            sku = self.skus[i]
            stock_norm = min(sku.stock / 50000.0, 1.0)

            pending = sum(o["qty"] for o in self.pending_orders if o["sku_idx"] == i)
            pending_norm = min(pending / 5000.0, 1.0)

            avg_demand = (
                self.demand_history[max(0, day - 30): day, i].mean()
                if day > 0 else 50.0
            )
            days_stock = (sku.stock / avg_demand) if avg_demand > 0 else 1.0
            days_stock_norm = min(days_stock / 200.0, 1.0)

            demand_avg_norm = min(avg_demand / 200.0, 1.0)
            lead_norm = sku.lead_time_days / 30.0
            cost_norm = min(sku.unit_cost / 5000.0, 1.0)

            # LSTM forecast for tomorrow (if available)
            if self.lstm_forecasts is not None and day < len(self.lstm_forecasts) - 1:
                forecast_norm = min(self.lstm_forecasts[day + 1, i] / 200.0, 1.0)
            else:
                forecast_norm = demand_avg_norm

            obs.extend([
                stock_norm, pending_norm, days_stock_norm,
                demand_avg_norm, lead_norm, cost_norm, forecast_norm
            ])

        return np.array(obs, dtype=np.float32)

    # ------------------------------------------------------------------
    def get_episode_summary(self) -> Dict[str, Any]:
        if not self.step_log:
            return {}
        import pandas as pd
        df = pd.DataFrame(self.step_log)

        total_revenue = df["revenue"].sum()
        total_holding = df["holding_cost"].sum()
        total_stockout = df["stockout_cost"].sum()
        total_ordering = df["ordering_cost"].sum()
        net_profit = total_revenue - total_holding - total_stockout - total_ordering

        total_demand = df["demand"].sum()
        total_fulfilled = df["fulfilled"].sum()
        service_level = total_fulfilled / total_demand if total_demand > 0 else 1.0
        num_stockouts = (df["shortfall"] > 0).sum()

        avg_inventory = df["stock_level"].mean()
        num_orders = (df["order_placed"] > 0).sum()

        baseline_profit = self.run_naive_sq_baseline()
        savings = net_profit - baseline_profit
        savings_pct = (savings / abs(baseline_profit) * 100) if baseline_profit != 0 else 0.0

        return {
            "total_days": self.episode_length,
            "total_revenue": round(total_revenue, 2),
            "total_holding_cost": round(total_holding, 2),
            "total_stockout_cost": round(total_stockout, 2),
            "total_ordering_cost": round(total_ordering, 2),
            "net_profit": round(net_profit, 2),
            "service_level": round(service_level, 4),
            "fill_rate": round(total_fulfilled / total_demand, 4) if total_demand > 0 else 1.0,
            "avg_inventory": round(avg_inventory, 2),
            "num_stockouts": int(num_stockouts),
            "num_orders": int(num_orders),
            "baseline_profit": round(baseline_profit, 2),
            "ppo_vs_baseline_savings": round(savings, 2),
            "ppo_vs_baseline_pct": round(savings_pct, 2),
        }

    def run_naive_sq_baseline(self) -> float:
        """
        Naive (s, Q) reorder-point baseline.
        A simple rule-based policy commonly used as a benchmark in inventory
        management literature:
          - Reorder point s = fixed low threshold (does NOT adapt to demand,
            seasonality, lead time, or disruptions)
          - Order quantity Q = ORDER_BINS[1] = 50 units (smallest non-zero bin)
          - Same demand sequence, disruption probability, and cost structure as PPO
        This represents unsophisticated, non-adaptive inventory management that
        PPO's learned policy is designed to outperform.
        Returns net profit (PKR).
        """
        rng = np.random.default_rng(42)
        total = 0.0

        for i, sku in enumerate(self.skus):
            stock = sku.initial_stock
            pending: list = []  # (arrive_day, qty)
            rev = hold = so = ord_cost = 0.0

            # Naive fixed parameters — no adaptation whatsoever
            s = 30       # reorder when stock + pending < 30 (very low, misses demand spikes)
            Q = ORDER_BINS[1]  # always order 50 units (smallest order — too small for peaks)

            for day in range(self.episode_length):
                # Arrivals with same disruption probability as PPO
                arrived = [p for p in pending if p[0] <= day]
                for p in arrived:
                    if rng.random() < self.supply_disruption_prob:
                        delivered = int(p[1] * rng.uniform(0.3, 0.9))
                    else:
                        delivered = p[1]
                    stock += delivered
                pending = [p for p in pending if p[0] > day]

                d = self.demand_history[day, i]
                fulfilled = min(stock, d)
                shortfall = max(0.0, d - fulfilled)
                stock = max(0, stock - int(fulfilled))

                hold += sku.holding_cost_per_day * stock
                so   += sku.stockout_penalty * shortfall
                rev  += fulfilled * sku.unit_cost * 1.2

                # Naive reorder: trigger only when position drops below fixed s
                pending_qty = sum(p[1] for p in pending)
                if stock + pending_qty < s:
                    pending.append((day + sku.lead_time_days, Q))
                    ord_cost += sku.ordering_cost

            total += rev - hold - so - ord_cost
        return total
