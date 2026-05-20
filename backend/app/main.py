from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import simulation, training, forecasting, analytics

app = FastAPI(
    title="SQUID — Smart Queue Unleashing Inventory Dominance",
    description="8 arms. Zero stockouts. RL-powered inventory manager. All values in PKR.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router)
app.include_router(training.router)
app.include_router(forecasting.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {
        "app": "SQUID",
        "tagline": "8 arms. Zero stockouts.",
        "currency": "PKR (₨)",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
