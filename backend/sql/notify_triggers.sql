-- Triggers for real-time Postgres LISTEN/NOTIFY broadcast on attendance and leave updates

CREATE OR REPLACE FUNCTION notify_attendance() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('attendance_channel', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_notify_trigger ON attendance;
CREATE TRIGGER attendance_notify_trigger
AFTER INSERT OR UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION notify_attendance();


CREATE OR REPLACE FUNCTION notify_leave() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('leave_channel', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_notify_trigger ON leave_requests;
CREATE TRIGGER leave_notify_trigger
AFTER INSERT OR UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION notify_leave();
