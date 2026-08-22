import React, { useState, useEffect } from "react";
import apiClient from "../../shared/api/client";
import { Check, X, CalendarCheck, Clock, Users, RefreshCw } from "lucide-react";

export const AdminApprovalsModule = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending_leaves");
  const [reviewComments, setReviewComments] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaveRes, attRes] = await Promise.all([
        apiClient.get("/api/leave/all-requests"),
        apiClient.get("/api/attendance/all-records"),
      ]);
      setLeaveRequests(leaveRes.data);
      setAllAttendance(attRes.data);
    } catch (err) {
      console.error("Failed to load admin approval records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (leaveId, status) => {
    try {
      await apiClient.post(`/api/leave/${leaveId}/review`, {
        status: status,
        comments: reviewComments[leaveId] || "",
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed.");
    }
  };

  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading approval queues...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">HR Management & Approvals</h1>
        <p className="text-sm text-slate-400">Review pending time-off requests and monitor company-wide attendance records.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("pending_leaves")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "pending_leaves"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Pending Approvals ({pendingLeaves.length})
        </button>
        <button
          onClick={() => setActiveTab("all_attendance")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "all_attendance"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" /> Live Attendance Sheet ({allAttendance.length})
        </button>
      </div>

      {/* Tab Content 1: Pending Leaves */}
      {activeTab === "pending_leaves" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Leave Details</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="py-4">
                        <div className="font-semibold text-white">{req.employee_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{req.employee_code}</div>
                      </td>
                      <td className="py-4 text-slate-300">{req.department || "General"}</td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 mr-2">
                          {req.leave_type}
                        </span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          {req.start_date} → {req.end_date} ({req.days_count}d)
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                      <td className="py-4">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add note..."
                              value={reviewComments[req.id] || ""}
                              onChange={(e) =>
                                setReviewComments({ ...reviewComments, [req.id]: e.target.value })
                              }
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleReview(req.id, "approved")}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                              title="Approve Request"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReview(req.id, "rejected")}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                req.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {req.status}
                            </span>
                            {req.reviewer_name && (
                              <span className="text-[10px] text-slate-500">by {req.reviewer_name}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Live Attendance Sheet */}
      {activeTab === "all_attendance" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Check-In</th>
                  <th className="pb-3">Check-Out</th>
                  <th className="pb-3">Hours Worked</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {allAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-500">
                      No attendance records logged yet.
                    </td>
                  </tr>
                ) : (
                  allAttendance.map((att) => (
                    <tr key={att.id}>
                      <td className="py-3">
                        <div className="font-semibold text-white">{att.employee_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{att.employee_code}</div>
                      </td>
                      <td className="py-3 text-slate-300">{att.department || "Engineering"}</td>
                      <td className="py-3 font-mono">{att.date}</td>
                      <td className="py-3 text-slate-400 font-mono">
                        {att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-300">{att.work_hours ? `${att.work_hours} hrs` : "In Progress"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
