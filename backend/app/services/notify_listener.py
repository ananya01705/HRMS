"""
Owned by Person B: bridges Postgres LISTEN/NOTIFY to the WebSocket broadcast layer.

Steps to implement:
1. Open a dedicated asyncpg connection (separate from the SQLAlchemy pool below).
2. await conn.add_listener("attendance_channel", on_attendance_notify)
3. In the callback, parse the JSON payload (sent by the pg_notify trigger) and
   call app.api.websocket.broadcast(...) with the relevant data.
4. Start this listener from the FastAPI lifespan in app/main.py.

Matching Postgres trigger (add this in an Alembic migration):

    CREATE OR REPLACE FUNCTION notify_attendance() RETURNS trigger AS $$
    BEGIN
        PERFORM pg_notify('attendance_channel', row_to_json(NEW)::text);
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER attendance_notify_trigger
    AFTER INSERT OR UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION notify_attendance();
"""

import asyncpg

from app.core.config import settings


async def start_listener():
    raw_dsn = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(raw_dsn)

    async def on_attendance_notify(connection, pid, channel, payload):
        # TODO(Person B): parse payload (JSON string), broadcast over websocket
        print(f"Notification on {channel}: {payload}")

    await conn.add_listener("attendance_channel", on_attendance_notify)
    return conn
