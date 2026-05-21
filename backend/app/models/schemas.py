from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class DemandPattern(str, Enum):
    random = "random"
    seasonal = "seasonal"


class DemandVolatility(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SimulationLength(int, Enum):
    month = 30
    quarter = 90
    half_year = 180
    year = 365


class SKUConfig(BaseModel):
    sku_id: str
    name: str
    unit_cost: float = Field(..., description="Cost per unit in PKR")
    holding_cost_per_day: float = Field(..., description="PKR per unit per day")
    stockout_penalty: float = Field(..., description="PKR per unit short")
    ordering_cost: float = Field(..., description="PKR per order placed")
    lead_time_days: int = Field(..., ge=1, le=30)
    initial_stock: int = Field(..., ge=0)
    reorder_point: int = Field(default=50)
    order_qty: Optional[float] = None


class SimulationConfig(BaseModel):
    num_skus: int = Field(default=5, ge=1, le=10)
    simulation_days: int = Field(default=365, ge=1, le=365)
    demand_pattern: DemandPattern = DemandPattern.random
    demand_volatility: DemandVolatility = DemandVolatility.medium
    seasonal_amplitude: float = Field(default=0.3, ge=0.0, le=1.0)
    supply_disruption_prob: float = Field(default=0.05, ge=0.0, le=0.5)
    skus: Optional[List[SKUConfig]] = None
    seed: Optional[int] = None


class StepResult(BaseModel):
    day: int
    sku_id: str
    stock_level: int
    demand: float
    fulfilled: float
    shortfall: float
    order_placed: int
    pending_order: int
    reward: float
    holding_cost: float
    stockout_cost: float
    ordering_cost: float
    revenue: float


class EpisodeSummary(BaseModel):
    total_days: int
    total_revenue: float
    total_holding_cost: float
    total_stockout_cost: float
    total_ordering_cost: float
    net_profit: float
    service_level: float
    fill_rate: float
    avg_inventory: float
    num_stockouts: int
    num_orders: int
    baseline_profit: float
    ppo_vs_baseline_savings: float
    ppo_vs_baseline_pct: float


class ForecastResult(BaseModel):
    sku_id: str
    method: str
    forecast_days: int
    predicted_demand: List[float]
    confidence_lower: List[float]
    confidence_upper: List[float]
    mae: Optional[float] = None
    rmse: Optional[float] = None


class TrainingStatus(BaseModel):
    job_id: str
    status: str
    progress_pct: float
    current_step: int
    total_steps: int
    mean_reward: Optional[float] = None
    message: str


class UploadedDataRow(BaseModel):
    date: str
    sku_id: str
    demand: float
    unit_cost: float
    lead_time: int
