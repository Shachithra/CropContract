import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db, seed_db
from app.routers import auth, contracts, scans, sync, alerts, outbreaks, deliveries, warnings, price_ranges

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await seed_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contracts.router)
app.include_router(scans.router)
app.include_router(sync.router)
app.include_router(alerts.router)
app.include_router(outbreaks.router)
app.include_router(deliveries.router)
app.include_router(warnings.router)
app.include_router(price_ranges.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"service": settings.APP_NAME, "docs": "/docs"}
