import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, Settings, Eye } from "lucide-react";
import api from "../../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // NEW: dashboard stats + last 7 days chart
  const [dashboard, setDashboard] = useState(null);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const shopRes = await api.get("/shops/my");
      const shopList = Array.isArray(shopRes.data) ? shopRes.data : [];
      setShops(shopList);

      const countPromises = shopList.map(async (s) => {
        try {
          const p = await api.get(`/products/shop/${s.id}`);
          return { shopId: s.id, count: Array.isArray(p.data) ? p.data.length : 0 };
        } catch {
          return { shopId: s.id, count: 0 };
        }
      });

      const productCounts = await Promise.all(countPromises);
      const map = {};
      productCounts.forEach((r) => (map[r.shopId] = r.count));
      setCounts(map);

      // 🔥 Load analytics data
      const dashRes = await api.get("/dashboard/shop");
      const chartRes = await api.get("/dashboard/shop/7days");

      setDashboard(dashRes.data);
      setSalesData(chartRes.data);

    } catch (err) {
      console.log("Error loading dashboard:", err);
    }

    setLoading(false);
  };

  const deleteShop = async (shopId) => {
    if (!window.confirm("Delete this shop?")) return;

    try {
      setDeletingId(shopId);
      await api.delete(`/shops/${shopId}`);
      setShops((p) => p.filter((s) => s.id !== shopId));
    } catch {
      alert("Unable to delete shop");
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-700">
        <div className="animate-pulse text-lg font-semibold">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900">
            Vendor Dashboard
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            Manage shops, products & analytics.
          </p>
        </div>

        <Link
          to="/vendor/shops/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold"
        >
          <PlusCircle size={20} /> Create Shop
        </Link>
      </div>

      {/* ANALYTICS CARDS */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DashCard title="Total Revenue" value={`₹${dashboard.totalRevenue}`} color="green" />
          <DashCard title="Total Orders" value={dashboard.totalOrders} color="indigo" />
          <DashCard title="Customers" value={dashboard.customers} color="orange" />
          <DashCard title="Today Revenue" value={`₹${dashboard.todayRevenue}`} color="purple" />
        </div>
      )}

      {/* 🔥 LINE CHART (Last 7 Days Sales) */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border mb-12" style={{ height: 350 }}>
        <h2 className="text-xl font-bold mb-4">Sales (Last 7 Days)</h2>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="20%" stopColor="#4F46E5" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="day" tickMargin={10} />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              fill="url(#colorSales)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SHOPS LIST */}
      {shops.length === 0 ? (
        <EmptyShops />
      ) : (
        <ShopGrid
          shops={shops}
          counts={counts}
          deletingId={deletingId}
          deleteShop={deleteShop}
          navigate={navigate}
        />
      )}
    </div>
  );
}

/* ------------------------- SUB COMPONENTS ------------------------- */

function DashCard({ title, value, color }) {
  const colors = {
    green: "text-green-600 bg-green-100",
    indigo: "text-indigo-600 bg-indigo-100",
    orange: "text-orange-500 bg-orange-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        ●
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  );
}

function EmptyShops() {
  return (
    <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200">
      <p className="text-xl text-gray-700 mb-6">
        You have no shops yet. Start your business journey.
      </p>
      <Link
        to="/vendor/shops/create"
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700"
      >
        Create Your First Shop
      </Link>
    </div>
  );
}

function ShopGrid({ shops, counts, deletingId, deleteShop, navigate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {shops.map((shop) => (
        <div
          key={shop.id}
          className="p-6 rounded-3xl bg-white/70 backdrop-blur-xl border shadow-xl hover:shadow-2xl transition-all"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="text-2xl font-bold">{shop.name}</h3>
              <p className="text-gray-600">{shop.description}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => navigate(`/vendor/shops/${shop.id}`)} className="p-2 bg-gray-100 rounded-xl">
                <Eye size={18} />
              </button>
              <button
                onClick={() => navigate(`/vendor/products/add?shopId=${shop.id}`)}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <PlusCircle size={18} />
              </button>
              <button
                onClick={() => navigate(`/vendor/shops/${shop.id}/edit`)}
                className="p-2 bg-gray-100 rounded-xl"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => deleteShop(shop.id)}
                disabled={deletingId === shop.id}
                className="p-2 bg-red-100 text-red-600 rounded-xl"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border shadow-inner">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold">{counts[shop.id] || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border shadow-inner">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold">
                {shop.active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => navigate(`/vendor/shops/${shop.id}`)}
              className="text-indigo-600 font-medium hover:underline"
            >
              Manage Shop
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/vendor/shops/${shop.id}/products`)}
                className="px-4 py-2 border rounded-xl"
              >
                Products
              </button>
              <button
                onClick={() => navigate(`/vendor/shops/${shop.id}/analytics`)}
                className="px-4 py-2 border rounded-xl"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}