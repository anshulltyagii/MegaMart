import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import { Loader2, Download, ChevronDown, ChevronUp } from "lucide-react";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({}); // Track expanded rows
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filtered, setFiltered] = useState([]);

  // -------------------------------------------------------
  // LOAD ORDERS FROM BACKEND
  // -------------------------------------------------------
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.orders.getAll();
      const list = res.data || [];

      console.log("RAW ORDERS FROM BACKEND =", list);

      setOrders(list);
      setFiltered(list);
    } catch (err) {
      console.error("Failed to load orders", err);
      alert("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // -------------------------------------------------------
  // FILTER + SEARCH
  // -------------------------------------------------------
  useEffect(() => {
    let list = [...orders];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((o) =>
        String(o.orderId).includes(term) ||
        o.orderNumber?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.status === statusFilter);
    }

    setFiltered(list);
  }, [search, statusFilter, orders]);

  // -------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------
  const updateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Change status to '${newStatus}'?`)) return;

    console.log("Order id sent:", orderId);
    console.log("Status sent:", newStatus);

    try {
      const res = await adminAPI.orders.update(orderId, newStatus);

      // Update UI immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error("Failed to update order status", err);
      alert("Failed to update order status.");
    }
  };

  // -------------------------------------------------------
  // EXPORT CSV
  // -------------------------------------------------------
  const exportCSV = () => {
    if (filtered.length === 0) return alert("No orders to export.");

    const header = [
      "Order ID",
      "Order Number",
      "Total Amount",
      "Status",
      "Payment Status",
      "Created At",
    ];

    const rows = filtered.map((o) => [
      o.orderId,
      o.orderNumber,
      o.totalAmount,
      o.status,
      o.paymentStatus,
      o.createdAt,
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "orders.csv";
    link.click();
  };

  // Expand row toggle
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -------------------------------------------------------
  // STATUS BADGE
  // -------------------------------------------------------
  const StatusBadge = ({ status }) => {
    const colors = {

      PLACED: "bg-yellow-100 text-yellow-700",
      CONFIRMED:"bg-green-100 text-yellow-700",
      SHIPPED: "bg-blue-100 text-blue-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      RETURNED: "bg-purple-100 text-purple-700",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm ${colors[status] || "bg-gray-200"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
      <p className="text-gray-600 mb-6">View, filter, and update orders.</p>

      {/* FILTERS */}
      <div className="flex items-center gap-4 mb-6">
        <input
          className="border px-4 py-2 rounded-xl w-64"
          placeholder="Search by Order ID or Number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-4 py-2 rounded-xl"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RETURNED">Returned</option>
        </select>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No orders found.</p>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-700">
                <th className="p-3">Order ID</th>
                <th className="p-3">Order Number</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Update</th>
                <th className="p-3">Items</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((o) => (
                <React.Fragment key={o.orderId}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">{o.orderId}</td>
                    <td className="p-3">{o.orderNumber}</td>
                    <td className="p-3 font-semibold">₹{o.totalAmount}</td>

                    <td className="p-3">
                      <StatusBadge status={o.status} />
                    </td>

                    <td className="p-3">
                      <select
                        className="border rounded-xl px-3 py-1"
                        value={o.status}
                        onChange={(e) =>
                          updateStatus(o.orderId, e.target.value)
                        }
                      >
                        <option value="PLACED">Placed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="SHIPPED">Shipped</option>  
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURNED">Returned</option>
                      </select>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => toggleExpand(o.orderId)}
                        className="flex items-center gap-1 text-blue-600"
                      >
                        {expanded[o.orderId] ? (
                          <>
                            <ChevronUp size={16} /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> View
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED ITEMS ROW */}
                  {expanded[o.orderId] && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4">
                        {!o.items || o.items.length === 0 ? (
                          <p className="text-gray-500">No items found.</p>
                        ) : (
                          <table className="w-full text-sm border rounded-lg bg-white shadow">
                            <thead className="bg-gray-100 border-b">
                              <tr>
                                <th className="p-2">Product ID</th>
                                <th className="p-2">Product Name</th>
                                <th className="p-2">Qty</th>
                                <th className="p-2">Unit Price</th>
                                <th className="p-2">Total</th>
                              </tr>
                            </thead>

                            <tbody>
                              {o.items.map((it, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="p-2">{it.productId}</td>
                                  <td className="p-2">{it.productName}</td>
                                  <td className="p-2">{it.quantity}</td>
                                  <td className="p-2">₹{it.unitPrice}</td>
                                  <td className="p-2">₹{it.totalPrice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;