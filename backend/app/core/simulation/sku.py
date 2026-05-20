from dataclasses import dataclass, field


@dataclass
class SKU:
    sku_id: str
    name: str
    unit_cost: float          # PKR
    holding_cost_per_day: float
    stockout_penalty: float
    ordering_cost: float
    lead_time_days: int
    initial_stock: int
    reorder_point: int = 50
    stock: int = field(init=False)

    def __post_init__(self):
        self.stock = self.initial_stock

    def reset(self):
        self.stock = self.initial_stock
