from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import attendance, auth, leave, payroll, websocket
from app.services.notify_listener import start_listener

listener_connection = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global listener_connection
    # Person B: uncomment once notify_listener.py's callback is implemented
    # listener_connection = await start_listener()
    yield
    if listener_connection:
        await listener_connection.close()


app = FastAPI(title="Dayflow HRMS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
