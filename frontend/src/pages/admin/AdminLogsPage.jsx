import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import { Calendar, Search, Clock, Filter } from "lucide-react";

const dateFilters = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "Last 7 Days", value: "WEEK" },
  { label: "Last 30 Days", value: "MONTH" },
  { label: "Last 6 Months", value: "SIX_MONTHS" },
  { label: "All Time", value: "ALL" },
];

// Helper function → return true if log is inside selected filter
function filterByDate(logDateString, filterValue) {
  const now = new Date();
  const logDate = new Date(logDateString);

  switch (filterValue) {
    case "TODAY":
      return logDate.toDateString() === now.toDateString();

    case "YESTERDAY":
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return logDate.toDateString() === yesterday.toDateString();

    case "WEEK":
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return logDate >= weekAgo;

    case "MONTH":
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      return logDate >= monthAgo;

    case "SIX_MONTHS":
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return logDate >= sixMonthsAgo;

    default:
      return true;
  }
}

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const loadLogs = async () => {
    try {
      const res = await adminAPI.logs.getLogs(200);
      setLogs(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("Failed to load admin logs", err);
      alert("Failed to load admin logs");
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {

    let list = [...logs];
    list = list.filter(log => filterByDate(log.createdAt, selectedFilter));

  if (search.trim()) {
    const term = search.toLowerCase();

    list = list.filter((log) => {
      const action = (log.action || "").toLowerCase();
      const desc = (log.description || "").toLowerCase();
      const user = (log.performedBy || "").toLowerCase();
      const date = (log.timestamp || "").toLowerCase();

      return (
        action.includes(term) ||
        desc.includes(term) ||
        user.includes(term) ||
        date.includes(term)
      );
    });
  }

  setFiltered(list);
  }, [search, setFiltered,logs]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Logs
        </h1>
        <p className="text-gray-600 mb-6">
          History of all admin operations across the system.
        </p>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">

          {/* Search Bar */}
          <div className="flex items-center bg-white shadow-sm rounded-lg px-3 w-full md:w-flex-grow">
            <Search className="text-gray-400 shrink-0" size={18} />
            <input
              className="px-3 py-2 w-full outline-none"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center bg-white shadow-sm rounded-lg px-3 py-2">
            <Filter className="text-gray-500 mr-2" size={18} />
            <select
              className="w-full outline-none text-gray-700 cursor-pointer bg-transparent"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              {dateFilters.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Logs List */}
        <div className="bg-white shadow rounded-xl p-5">

          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No logs available.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((log, index) => (
                <li key={index} className="py-4 flex items-start gap-4">

                  {/* Icon */}
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="text-blue-600" size={22} />
                  </div>

                  {/* Log Details */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {log.action}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {log.details}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>

                </li>
              ))}
            </ul>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminLogsPage;