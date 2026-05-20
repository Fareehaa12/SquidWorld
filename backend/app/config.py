from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "SQUID Inventory Manager"
    debug: bool = True
    currency: str = "PKR"
    currency_symbol: str = "₨"

    # Paths
    checkpoints_dir: Path = BASE_DIR / "checkpoints"
    models_dir: Path = BASE_DIR.parent / "models"
    data_dir: Path = BASE_DIR / "data"

    # Simulation defaults
    num_skus: int = 10
    episode_length: int = 365
    max_order_qty: int = 500

    # RL training
    total_timesteps: int = 2_000_000
    n_envs: int = 4

    class Config:
        env_file = ".env"


settings = Settings()
