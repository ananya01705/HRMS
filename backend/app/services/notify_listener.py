import json
import asyncpg
from app.core.config import settings
from app.api.websocket import broadcast


async def start_listener():
    try:
        raw_dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(raw_dsn)

        async def on_attendance_notify(connection, pid, channel, payload):
            try:
                data = json.loads(payload)
                await broadcast({
                    "event": "ATTENDANCE_UPDATE",
                    "channel": channel,
                    "data": data,
                })
            except Exception as e:
                print(f"[WebSocket Broadcast Error] {e}")

        async def on_leave_notify(connection, pid, channel, payload):
            try:
                data = json.loads(payload)
                await broadcast({
                    "event": "LEAVE_UPDATE",
                    "channel": channel,
                    "data": data,
                })
            except Exception as e:
                print(f"[WebSocket Broadcast Error] {e}")

        await conn.add_listener("attendance_channel", on_attendance_notify)
        await conn.add_listener("leave_channel", on_leave_notify)
        print("Postgres LISTEN triggers registered on attendance_channel and leave_channel")
        return conn
    except Exception as e:
        print(f"Postgres notify listener could not start: {e}")
        return None
