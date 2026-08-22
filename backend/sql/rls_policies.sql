-- Row-Level Security. Apply once Person B's `attendance` / `leave_requests`
-- tables exist (adjust names/columns if they differ from the agreed schema).
--
-- Routes must use `get_scoped_db` instead of plain `get_db` (see deps.py) for
-- these policies to see who's asking — that dependency sets the two session
-- vars these policies read.

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_own_attendance ON attendance
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('admin', 'hr_officer')
        OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    );

CREATE POLICY employee_own_leave_select ON leave_requests
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('admin', 'hr_officer')
        OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    );

-- Only admin/hr_officer can approve or reject leave (UPDATE):
CREATE POLICY leave_approval_admin_only ON leave_requests
    FOR UPDATE
    USING (current_setting('app.current_user_role', true) IN ('admin', 'hr_officer'));

-- Everyone can insert their own leave request/attendance row (app code already
-- forces user_id = current_user.id when creating these; RLS is a backstop here):
CREATE POLICY own_leave_insert ON leave_requests
    FOR INSERT
    WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
