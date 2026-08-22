import React, { useState } from "react";
import { useAuth } from "../shared/context/AuthContext";
import { useWebSocket } from "../shared/hooks/useWebSocket";
import { Bell, Wifi, WifiOff, User as UserIcon } from "lucide-react";

export const Navbar = ({ onOpenProfile }) => {
  const { user } = useAuth();
  const { connected, messages } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Search / Title Area */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Department: {user?.department || "Corporate"}
        </span>
        <span className="text-xs text-slate-400">
          ID: <code className="text-slate-300 font-mono">{user?.employee_code}</code>
        </span>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-4">
        {/* Real-time Connection Indicator */}
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            connected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
          title={connected ? "Real-time LISTEN/NOTIFY WebSocket Active" : "Reconnecting to event bus..."}
        >
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 animate-pulse" />}
          <span className="font-medium">{connected ? "Live Stream" : "Connecting..."}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {messages.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Real-time Events</h4>
                <span className="text-[10px] text-indigo-400 font-mono">{messages.length} received</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No real-time events triggered yet.</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                      <span className="font-bold text-indigo-400 uppercase tracking-wide block text-[10px]">
                        {msg.event}
                      </span>
                      <p className="text-slate-300 font-mono text-[11px] mt-0.5 truncate">
                        {JSON.stringify(msg.data)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition-colors"
        >
          <span>{user?.full_name?.split(" ")[0]}</span>
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </header>
  );
};
