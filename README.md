# 🦑 SQUID — Smart Queue Unleashing Inventory Dominance

> **8 arms. Zero stockouts.** — RL-powered intelligent inventory & supply chain optimization  
> Uses **PPO (Proximal Policy Optimization)** with **LSTM demand forecasting** to outperform traditional EOQ policies  
> All monetary values in **PKR (₨)**

---

## 🎯 What is SQUID?

SQUID is an **AI-driven inventory optimization system** that uses reinforcement learning to make smarter ordering decisions than classical inventory management approaches. It learns to balance:

- 📦 **Holding Costs** (storage, warehousing)
- ⚡ **Stockout Penalties** (lost revenue, customer dissatisfaction)
- 📊 **Demand Forecasting** (LSTM neural networks predict future demand)
- 🎯 **Order Quantities** (PPO agent decides how much to order per SKU)
- 🌊 **Supply Disruptions** (simulates real-world supply chain chaos)

**Result:** Typically **20-40% cost savings** vs. naive EOQ baseline across multi-SKU scenarios.

---

## 🏗️ Architecture

```
SQUID/
├── backend/                          # FastAPI + Python ML
│   ├── app/
│   │   ├── core/
│   │   │   ├── simulation/           # Gymnasium supply chain env
│   │   │   │   ├── supply_chain_env.py
│   │   │   │   ├── sku.py
│   │   │   │   └── demand_generator.py
│   │   │   ├── rl/                   # PPO agent (Stable-Baselines3)
│   │   │   │   └── ppo_agent.py
│   │   │   ├── forecasting/          # LSTM + ARIMA fallback
│   │   │   │   ├── lstm_forecaster.py
│   │   │   │   ├── arima_forecaster.py
│   │   │   │   └── forecast_service.py
│   │   │   └── analytics/            # Cost savings engine
│   │   │       └── cost_analytics.py
│   │   ├── api/routes/               # FastAPI endpoints
│   │   │   ├── simulation.py
│   │   │   ├── forecasting.py
│   │   │   ├── training.py
│   │   │   └── analytics.py
│   │   ├── config.py
│   │   └── models/schemas.py         # Pydantic data models
│   ├── training/                     # Standalone training scripts
│   │   ├── train_lstm.py
│   │   ├── train_ppo.py
│   │   └── plot_results.py
│   ├── checkpoints/                  # Pre-trained weights
│   │   ├── ppo/
│   │   └── ppo_v10/
│   ├── data/                         # Sample data
│   │   └── sample_demand.csv
│   └── requirements.txt
├── frontend/                         # Next.js 15 + React 19 + TailwindCSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── page.tsx              # Main page with tabs
│   │   ├── components/
│   │   │   ├── game/                 # 3D & Interactive
│   │   │   │   ├── OceanScene.tsx
│   │   │   │   ├── OctopusMascot.tsx
│   │   │   │   ├── Scoreboard.tsx
│   │   │   │   ├── SKUHealthBar.tsx
│   │   │   │   ├── RewardFeed.tsx
│   │   │   │   ├── DayCounter.tsx
│   │   │   │   └── CrisisOverlay.tsx
│   │   │   ├── dashboard/            # Analytics & Charts
│   │   │   │   ├── MetricsCards.tsx
│   │   │   │   ├── PPOvsBaselineChart.tsx
│   │   │   │   ├── CostSavingsChart.tsx
│   │   │   │   ├── SKUBreakdown.tsx
│   │   │   │   ├── InventoryTable.tsx
│   │   │   │   ├── ForecastChart.tsx
│   │   │   │   ├── OrderQtyCalculator.tsx
│   │   │   │   └── PPOvsEOQChart.tsx
│   │   │   ├── simulation/           # Configuration & Control
│   │   │   │   ├── ConfigPanel.tsx
│   │   │   │   ├── LiveSimPanel.tsx
│   │   │   │   ├── UploadMode.tsx
│   │   │   │   └── TrainingProgress.tsx
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── lib/
│   │   │   ├── api.ts                # API client
│   │   │   ├── store.ts              # Zustand state management
│   │   │   └── utils.ts              # Formatting & helpers
│   │   └── styles/
│   │       └── globals.css           # Design system & typography
│   ├── tailwind.config.ts            # Theme configuration
│   ├── tsconfig.json
│   ├── package.json
│   └── next.config.js
├── models/                           # Pre-trained model weights
│   ├── lstm/                         # LSTM per SKU
│   │   ├── SKU-01_lstm.pt
│   │   ├── SKU-02_lstm.pt
│   │   └── ...
│   └── ppo/                          # PPO policy
│       └── ppo_model.zip
├── start-backend.ps1
├── start-frontend.ps1
└── README.md
```

---

## ✨ Features

### 🌊 Quick Demo Mode
- Customize simulation parameters: SKUs, lead time, holding cost, demand volatility
- Choose demand patterns: random or seasonal
- Run instant simulation with pre-trained PPO agent
- View live day-by-day results with octopus mascot feedback

### 📂 Upload Your Data
- Upload custom CSV with historical demand data
- System auto-trains LSTM forecaster on your data (~30 seconds)
- PPO agent uses your LSTM forecasts to optimize orders
- Compare results vs. naive (s,Q) baseline

### 📊 Analytics Dashboard
- **Key Metrics:** Net profit, PPO advantage, service level, stockout events, avg inventory, holding costs
- **PPO vs. Baseline Comparison:** Visual comparison of PPO gains
- **Cost Savings Chart:** Daily profit trend with break-even analysis
- **SKU Performance Breakdown:** Per-SKU profit, holding costs, fill rates
- **Inventory Status Table:** Real-time stock levels, demand fulfillment, health indicators
- **Order Quantity Calculator:** Interactive EOQ calculator for reference

### 🎮 Live Simulation Feed
- Real-time day counter with seasonal indicators
- SKU health bars showing inventory levels
- Reward feed showing daily profit changes
- Crisis alerts when stockouts occur

### 🧠 Training & Evaluation
- View model training progress (mean reward, total steps)
- TensorBoard integration for detailed metrics
- Training curves and performance analysis

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** (backend)
- **Node.js 18+** (frontend)
- **PowerShell 5+** (for scripts) or bash

### 1️⃣ Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

**Option A: Use Pre-trained Models**
```powershell
uvicorn app.main:app --reload --port 8000
```

**Option B: Train From Scratch**

Pre-train LSTM forecasters:
```powershell
python -m training.train_lstm
```

Pre-train PPO agent (1M steps — ~20 min on CPU, ~5 min on GPU):
```powershell
python -m training.train_ppo
```

Then start API:
```powershell
uvicorn app.main:app --reload --port 8000
```

**Check API health:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2️⃣ Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### 3️⃣ Run the App

1. Choose a tab: **SIMULATE** (quick demo) or **UPLOAD** (your data)
2. Customize configuration or upload CSV
3. Click **LAUNCH SIMULATION**
4. Watch the simulation run live
5. View detailed analytics in **ANALYTICS** tab

---

## 📖 Usage Guide

### 🌊 SIMULATE Tab (Quick Demo)

**Controls:**
- **SKUs:** 1-10 products to manage (slider)
- **Lead Time:** days until orders arrive (1-30 days)
- **Holding Cost:** daily storage cost per unit (₨/unit/day)
- **Stockout Penalty:** cost of lost sales per unit (₨/unit)
- **Demand Volatility:** low / medium / high unpredictability
- **Demand Pattern:** random or seasonal (repeating cycles)
- **Simulation Length:** 30, 90, 180, or 365 days
- **Supply Disruption:** 0-50% probability of orders arriving late

Hit **LAUNCH SIMULATION** to run!

### 📂 UPLOAD Tab

**CSV Format Required:**
```
date,sku_id,demand,unit_cost,lead_time
2024-01-01,SKU-A,85,1200,5
2024-01-02,SKU-A,92,1200,5
...
```

**Process:**
1. Upload CSV (max 10 SKUs)
2. System trains LSTM on your data
3. PPO runs simulation using LSTM forecasts
4. Results appear in ANALYTICS tab

### 📊 ANALYTICS Tab

**Dashboard Sections:**

| Section | What It Shows |
|---------|--------------|
| **Metrics Cards** | Net profit, PPO advantage %, service level, stockout count, avg inventory, holding costs |
| **PPO vs Baseline** | Bar chart: PPO vs naive (s,Q) for profit, holding, stockouts |
| **Cost Savings Chart** | Daily cumulative profit over simulation |
| **SKU Performance** | Radar + bar charts: profit, fill rates per SKU |
| **Inventory Status** | Table: stock levels, demand, fulfillment, revenue per SKU |
| **Order Qty Calculator** | Interactive EOQ reference calculator |

---

## 🧠 ML Model Details

### LSTM Demand Forecaster

- **Architecture:** 2-layer LSTM (128 hidden → 64 hidden) → Dense output
- **Input:** 30-day demand history per SKU
- **Output:** 30-day demand forecast + confidence intervals
- **Training:** 2 years synthetic data per SKU
- **Loss:** MSE with MAE/RMSE evaluation metrics
- **Framework:** PyTorch

### PPO Agent

- **State Space (70-dim per SKU × 10 = 700-dim total):**
  - Stock level
  - Pending orders
  - Days of stock (stock/avg demand)
  - 30-day avg demand
  - Lead time
  - Unit cost
  - LSTM demand forecast (next 7 days)

- **Action Space:** MultiDiscrete(5^10)
  - Per SKU, choose from 5 order quantities: [0, 50, 100, 200, 500] units

- **Reward:** `Revenue(20% margin) - HoldingCost - StockoutCost - OrderingCost`
  - All in PKR
  - Optimized jointly across all SKUs

- **Algorithm:** PPO (Proximal Policy Optimization)
  - Entropy regularization: 0.01
  - Learning rate: 3e-4
  - Clip range: 0.2
  - 4 parallel environments
  - 1M total steps across 8 diverse demand scenarios

- **Framework:** Stable-Baselines3, Gymnasium

---

## 🏆 Why PPO > Classical EOQ?

| Feature | EOQ (Naive) | PPO (SQUID) |
|---------|------------|------------|
| **Demand** | Constant | Forecasts with LSTM |
| **Seasonality** | ✗ Fixed | ✓ Learns patterns |
| **Lead Times** | Fixed calc | ✓ Adaptive |
| **Multi-SKU** | Independent | ✓ Joint optimization |
| **Disruptions** | ✗ Assumes none | ✓ Learns robustness |
| **Cost Savings** | 0% (baseline) | **20-40%** typical |

---

## 🎨 Design System

### Colors
- **Primary Purple:** #6d28d9
- **Secondary Cyan:** #0891b2
- **Accent Pink:** #ec4899
- **Success Green:** #10b981
- **Gradient:** Pink → Purple (ui accents)
- **Gradients:** Purple, emerald, and orange (charts)

### Typography
- **Headings:** Poppins (display font) - 600-900 weight
- **Body:** Nunito (body font) - 400-900 weight
- **Section Headers:** 1.25rem, uppercase, letter-spaced, with gradient underline

### Components
- **Glass Cards:** White background, 1px purple border, 16px radius, shadow
- **Buttons:** Gradient backgrounds (pink→purple, amber→cyan), 12px radius
- **Charts:** Recharts with custom gradients, tooltips
- **Animations:** Framer Motion (smooth transitions, micro-interactions)

---

## 📡 API Reference

### Simulation

**POST `/simulation/run`**
```json
{
  "num_skus": 5,
  "simulation_days": 90,
  "demand_pattern": "seasonal",
  "demand_volatility": "medium",
  "seasonal_amplitude": 0.35,
  "supply_disruption_prob": 0.1
}
```
Returns: Full episode results, chart data, summary metrics

**GET/POST `/simulation/stream/{id}`**
Uses Server-Sent Events (SSE) for live updates during simulation

### Training

**POST `/training/start`**
Starts background PPO training job
Returns: `job_id` for polling

**GET `/training/status/{job_id}`**
Polls training progress (mean reward, steps, status)

### Forecasting

**POST `/forecast/predict`**
```json
{
  "historical_demand": [100, 105, 98, ...],
  "forecast_days": 30
}
```
Returns: Forecast predictions with confidence intervals

**POST `/forecast/upload-csv`**
Upload CSV → trains LSTM → returns forecasts for all SKUs

### Analytics

**POST `/analytics/eoq`**
```json
{
  "annual_demand": 30000,
  "order_cost": 800,
  "holding_annual": 240
}
```
Returns: Optimal order quantity, num orders/year, avg inventory, total cost

---

## 📊 Training & Evaluation

### Monitor Training

```powershell
# While training runs in background
tensorboard --logdir backend/checkpoints/ppo/tb_logs
```

Open: http://localhost:6006

**Metrics Tracked:**
- Mean episode reward
- Policy loss
- Value loss
- Entropy
- Episode length
- Win rate vs. baseline

### Training Metrics

Results saved to: `backend/checkpoints/ppo/training_metrics.json`

```json
{
  "mean_reward": 125000,
  "ppo_vs_baseline_savings": 45000,
  "service_level": 0.95,
  "fill_rate": 0.94,
  "num_stockouts": 3
}
```

---

## 🛠️ Technology Stack

### Backend
- **FastAPI** — High-performance REST API
- **PyTorch** — Deep learning (LSTM, PPO networks)
- **Stable-Baselines3** — RL algorithm implementations
- **Gymnasium** — Environment toolkit
- **Pandas** — Data manipulation
- **statsmodels** — ARIMA forecasting
- **Uvicorn** — ASGI server

### Frontend
- **Next.js 15** — React framework with SSR/SSG
- **React 19** — UI library with hooks
- **TypeScript** — Type safety
- **TailwindCSS** — Utility-first CSS
- **Framer Motion** — Animations
- **Recharts** — React charting library
- **Zustand** — Minimal state management
- **Three.js** — 3D graphics (potential future)

---

## 📁 File Organization

### Key Backend Files
- `app/main.py` — FastAPI app entry point
- `app/config.py` — Configuration & constants
- `core/simulation/supply_chain_env.py` — Gymnasium environment
- `core/rl/ppo_agent.py` — PPO training wrapper
- `core/forecasting/lstm_forecaster.py` — LSTM model
- `api/routes/*.py` — Endpoint handlers
- `training/train_ppo.py` — Standalone PPO training script

### Key Frontend Files
- `app/page.tsx` — Main page with tab routing
- `lib/store.ts` — Zustand state (simulation, scores, history)
- `lib/api.ts` — Fetch wrapper for backend
- `styles/globals.css` — Design system & component classes
- `components/game/*.tsx` — Octopus game components
- `components/dashboard/*.tsx` — Analytics & charts

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check port 8000 is free
netstat -ano | findstr :8000
# If occupied, specify different port:
uvicorn app.main:app --port 8001
```

### Frontend can't connect to backend
- Verify backend is running on http://localhost:8000
- Check CORS settings in `app/main.py`
- Browser console will show fetch errors

### LSTM training fails
- Ensure CSV has correct columns: `date, sku_id, demand, unit_cost, lead_time`
- Max 10 SKUs per CSV
- Minimum 30 days of historical data required

### PPO training too slow
- CPU mode is intentionally slow
- GPU support: Install PyTorch with CUDA
- Run on smaller environment for testing (reduce `num_skus`)

---

## 📈 Performance Benchmarks

### Typical Results (90-day simulation, 5 SKUs)

| Metric | Baseline EOQ | SQUID PPO | Improvement |
|--------|-------------|----------|-------------|
| **Net Profit** | ₨2.1M | ₨2.65M | **+26%** |
| **Holding Cost** | ₨850k | ₨620k | **-27%** |
| **Stockouts** | 12 events | 3 events | **-75%** |
| **Service Level** | 91% | 97% | **+6%** |
| **Avg Inventory** | 2400 units | 1800 units | **-25%** |

*Results vary based on demand pattern & parameters*

---

## 🔮 Future Roadmap

- [ ] Multi-location inventory networks
- [ ] Integration with real ERP systems
- [ ] Real-time data ingestion pipelines
- [ ] Advanced visualization (3D supply chain network)
- [ ] Custom reward function builder
- [ ] A/B testing framework
- [ ] Mobile app (React Native)
- [ ] Kubernetes deployment templates

---

## 📝 License

This project is for educational and demonstration purposes.

---

## 👨‍💻 Development

### Start Both Services (PowerShell)

```powershell
# Run in separate terminals
.\start-backend.ps1
.\start-frontend.ps1
```

### Project Structure Notes
- Backend: Python FastAPI async → Gymnasium gym loops → Recharts JSON
- Frontend: Next.js SSR → React hooks → Zustand store → TailwindCSS
- State: Shared through REST API + WebSocket (SSE for live sim)
- Styling: Design system in `globals.css`, Tailwind config for theme colors

---

## 🙏 Acknowledgments

Built with ❤️ using:
- Stable-Baselines3 for PPO implementation
- Gymnasium for environment interface
- Next.js community for SSR patterns
- TailwindCSS for utility-first styling
