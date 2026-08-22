import { useEffect, useState } from "react";
import apiClient from "./shared/api/client";

function App() {
  const [apiStatus, setApiStatus] = useState("checking...");

  useEffect(() => {
    apiClient
      .get("/health")
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("backend unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-medium text-gray-900">Dayflow HRMS</h1>
      <p className="mt-2 text-sm text-gray-500">API status: {apiStatus}</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Auth & profile</h2>
          <p className="text-sm text-gray-500">Owned by Person A — src/modules/auth</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Attendance & leave</h2>
          <p className="text-sm text-gray-500">Owned by Person B — src/modules/attendance-leave</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium">Payroll & analytics</h2>
          <p className="text-sm text-gray-500">Owned by Person C — src/modules/payroll-analytics</p>
        </div>
      </div>
    </div>
  );
}

export default App;
