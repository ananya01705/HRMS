import React, { useState, useEffect } from "react";
import apiClient from "../../shared/api/client";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Play, Square, Plus, RefreshCw } from "lucide-react";

export const AttendanceLeaveModule = () => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [balances, setBalances] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Leave Form Modal
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, balRes, attRes, leaveRes] = await Promise.all([
        apiClient.get("/api/attendance/today-status"),
        apiClient.get("/api/leave/balances"),
        apiClient.get("/api/attendance/my-records"),
        apiClient.get("/api/leave/my-requests"),
      ]);
      setTodayStatus(todayRes.data);
      setBalances(balRes.data);
      setMyAttendance(attRes.data);
      setMyLeaves(leaveRes.data);
    } catch (err) {
      console.error("Failed to load attendance/leave data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer simulation for checked-in status
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (todayStatus?.is_checked_in) {
      setElapsedSeconds(todayStatus.work_seconds || 0);
      const timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [todayStatus]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await apiClient.post("/api/attendance/check-in", { notes: "Web Check-In" });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await apiClient.post("/api/attendance/check-out", { notes: "Web Check-Out" });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);
    try {
      await apiClient.post("/api/leave/apply", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });
      setShowModal(false);
      setReason("");
      await fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to submit leave request.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatSeconds = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading attendance & leave data...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance & Time-Off</h1>
          <p className="text-sm text-slate-400">Track daily check-ins, work duration, and leave balances.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Top Grid: Check-In Widget + Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In / Check-Out Widget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Punch Status</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                todayStatus?.is_checked_in
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : todayStatus?.today_status === "completed"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {todayStatus?.is_checked_in
                ? "Active Check-In"
                : todayStatus?.today_status === "completed"
                ? "Shift Completed"
                : "Not Checked In"}
            </span>
          </div>

          <div className="my-6 text-center">
            <div className="text-4xl font-extrabold text-white font-mono tracking-wider">
              {todayStatus?.is_checked_in ? formatSeconds(elapsedSeconds) : "--:--:--"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {todayStatus?.is_checked_in
                ? `Checked in at ${new Date(todayStatus.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Press start to record attendance for today"}
            </p>
          </div>

          <div>
            {!todayStatus?.is_checked_in ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading || todayStatus?.today_status === "completed"}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                {todayStatus?.today_status === "completed" ? "Already Shift Completed" : "Clock In Now"}
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Square className="w-4 h-4 fill-white" /> Clock Out
              </button>
            )}
          </div>
        </div>

        {/* Leave Balances Cards */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Paid Leave</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono">
                {balances?.paid_allocated} Alloc
              </span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-bold text-white">{balances?.paid_remaining}</span>
              <span className="text-xs text-slate-400 ml-1.5">days left</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${(balances?.paid_remaining / (balances?.paid_allocated || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Sick Leave</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                {balances?.sick_allocated} Alloc
              </span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-bold text-white">{balances?.sick_remaining}</span>
              <span className="text-xs text-slate-400 ml-1.5">days left</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${(balances?.sick_remaining / (balances?.sick_allocated || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Unpaid Leave</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">
                Used
              </span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-bold text-white">{balances?.unpaid_used}</span>
              <span className="text-xs text-slate-400 ml-1.5">days taken</span>
            </div>
            <p className="text-[10px] text-slate-500">Requires line manager approval</p>
          </div>
        </div>
      </div>

      {/* Tables Grid: Attendance History & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance History */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Recent Attendance History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">In</th>
                  <th className="pb-3">Out</th>
                  <th className="pb-3">Hours</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {myAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-500">No attendance records found.</td>
                  </tr>
                ) : (
                  myAttendance.slice(0, 7).map((rec) => (
                    <tr key={rec.id}>
                      <td className="py-3 font-mono font-medium text-slate-200">{rec.date}</td>
                      <td className="py-3 text-slate-400">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</td>
                      <td className="py-3 text-slate-400">{rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</td>
                      <td className="py-3 font-mono text-indigo-300">{rec.work_hours ? `${rec.work_hours} hrs` : "--"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Requests History */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> My Leave Requests
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Dates</th>
                  <th className="pb-3">Days</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {myLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-500">No leave requests submitted yet.</td>
                  </tr>
                ) : (
                  myLeaves.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 font-semibold uppercase text-slate-200">{l.leave_type}</td>
                      <td className="py-3 text-slate-400">{l.start_date} → {l.end_date}</td>
                      <td className="py-3 font-mono">{l.days_count}d</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            l.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : l.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Request Time-Off</h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="paid">Paid Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason / Remarks</label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State reason for leave request..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
