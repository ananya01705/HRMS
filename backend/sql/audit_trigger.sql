-- Generic, reusable audit trail. Run this once after the initial migration.
-- Person B and C: attach the trigger to your own tables once they exist, e.g.
--   CREATE TRIGGER attendance_audit AFTER INSERT OR UPDATE OR DELETE ON attendance
--   FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,          -- INSERT / UPDATE / DELETE
    changed_by UUID,               -- populated from the app.current_user_id session var
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_data JSONB,
    new_data JSONB
);

CREATE OR REPLACE FUNCTION log_audit() RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        NULLIF(current_setting('app.current_user_id', true), '')::uuid,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- The changed_by column relies on `get_scoped_db` (backend/app/api/deps.py)
-- having set app.current_user_id earlier in the same request/transaction.
