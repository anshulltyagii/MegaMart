import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import {
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Download,
} from "lucide-react";

const AdminShopsPage = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // ---------------------------
  // Helper: derive status
  // ---------------------------
  const getStatus = (shop) => {
    if (!shop.isActive) return "DELETED";
    if (shop.isApproved === true) return "ACTIVE";
    if (shop.isApproved === false) return "REJECTED";
    return "PENDING";
  };

  // ---------------------------
  // Fetch shops + owner details
  // ---------------------------
  const fetchShops = async () => {
    try {
      setLoading(true);

      const shopRes = await adminAPI.shops.getEvery();
      const userRes = await adminAPI.users.getAll();

      const shopsList = shopRes.data || [];
      const users = userRes.data || [];

      const merged = shopsList.map((shop) => {
        const owner = users.find((u) => u.id === shop.ownerUserId);
        return {
          ...shop,
          ownerName: owner?.fullName || "Unknown",
          ownerEmail: owner?.email || "Unknown",
        };
      });

      setShops(merged);
      console.log("Merged shops:", merged);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // ---------------------------
  // Approve
  // ---------------------------
  const handleApprove = async (id) => {
    if (!window.confirm("Approve this shop?")) return;
    try {
      await adminAPI.shops.approve(id);
      setShops((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isApproved: true, isActive: true } : s
        )
      );
      alert("Shop approved");
    } catch (e) {
      console.error(e);
      alert("Failed to approve");
    }
  };

  // ---------------------------
  // Reject
  // ---------------------------
  const handleReject = async (id) => {
    if (!window.confirm("Reject this shop?")) return;
    try {
      await adminAPI.shops.reject(id);
      setShops((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isApproved: false, isActive: true } : s
        )
      );
      alert("Shop rejected");
    } catch (e) {
      console.error(e);
      alert("Failed to reject");
    }
  };

  // ---------------------------
  // Soft delete (isActive = false)
  // ---------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Soft delete this shop?")) return;
    try {
      await adminAPI.shops.delete(id);
      setShops((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: false } : s
        )
      );
      alert("Shop soft deleted");
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  // ---------------------------
  // Restore deleted (no new API)
  // Uses existing APPROVE endpoint
  // ---------------------------
  const handleRestore = async (id) => {
    if (!window.confirm("Restore this deleted shop as APPROVED?")) return;
    try {
      await adminAPI.shops.approve(id);
      setShops((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: true, isApproved: true } : s
        )
      );
      alert("Shop restored");
    } catch (e) {
      console.error(e);
      alert("Failed to restore");
    }
  };

  // ---------------------------
  // Filter + Search
  // ---------------------------
  const filteredShops = shops.filter((shop) => {
    const status = getStatus(shop);

    const q = search.toLowerCase();
    const matchSearch =
      shop.name.toLowerCase().includes(q) ||
      shop.ownerName.toLowerCase().includes(q) ||
      shop.ownerEmail.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filter === "ALL") return true;
    if (filter === "DELETED") return status === "DELETED";
    if (filter === "ACTIVE") return status === "ACTIVE";
    if (filter === "REJECTED") return status === "REJECTED";
    if (filter === "PENDING") return status === "PENDING";

    return true;
  });

  // ---------------------------
  // CSV Export (only filtered shops)
  // ---------------------------
  const exportCSV = () => {
    if (filteredShops.length === 0) {
      alert("No shops to export.");
      return;
    }

    const headers = ["Shop Name", "Owner Name", "Owner Email", "Status"];
    const rows = filteredShops.map((s) => [
      s.name,
      s.ownerName,
      s.ownerEmail,
      getStatus(s),
    ]);

    const csvLines = [headers, ...rows]
      .map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "shops_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------
  // UI helpers
  // ---------------------------
  const statusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "DELETED":
        return "bg-gray-200 text-gray-700";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Shops</h1>

        <button
          onClick={exportCSV}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          className="border px-3 py-2 rounded-lg w-64"
          placeholder="Search by shop / owner / email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded-lg"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option value="PENDING">Pending</option>
          <option value="DELETED">Deleted (Soft)</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-10 text-gray-500">Loading shops…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border shadow">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Shop</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const status = getStatus(shop);

                return (
                  <tr key={shop.id} className="border-t">
                    <td className="p-3 font-semibold">{shop.name}</td>

                    <td className="p-3">
                      <div>{shop.ownerName}</div>
                      <div className="text-xs text-gray-500">
                        {shop.ownerEmail}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">

                        {status === "DELETED" ? (
                          // Deleted → only Restore (using approve API)
                          <button
                            onClick={() => handleRestore(shop.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1 hover:bg-blue-700"
                          >
                            <RotateCcw size={14} />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(shop.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center gap-1 hover:bg-green-700"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>

                            <button
                              onClick={() => handleReject(shop.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1 hover:bg-red-700"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>

                            <button
                              onClick={() => handleDelete(shop.id)}
                              className="bg-gray-800 text-white px-3 py-1 rounded-md flex items-center gap-1 hover:bg-black"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredShops.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    No shops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminShopsPage;
