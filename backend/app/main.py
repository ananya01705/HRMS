from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import attendance, auth, employees, leave, payroll, analytics, websocket
from app.services.notify_listener import start_listener
from app.core.database import engine, Base

listener_connection = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global listener_connection
    # Ensure database tables exist on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    listener_connection = await start_listener()
    yield
    if listener_connection:
        try:
            await listener_connection.close()
        except Exception:
            pass


app = FastAPI(
    title="Dayflow HRMS API",
    description="Production-grade, high performance HRMS REST API with real-time WebSockets, RLS, and Audit Logging",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)
app.include_router(analytics.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok", "system": "Dayflow HRMS API"}
