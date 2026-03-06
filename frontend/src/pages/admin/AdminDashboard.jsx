import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Store,
  ShoppingCart,
  PackageSearch,
  Layers,
  TicketPercent,
  Clock,
} from "lucide-react";

const menuItems = [
  {
    title: "Manage Users",
    description: "View, filter, suspend or activate users.",
    icon: Users,
    path: "/admin/users",
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "Manage Shops",
    description: "Approve or reject shops, manage sellers.",
    icon: Store,
    path: "/admin/shops",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Manage Orders",
    description: "Track, update and process orders.",
    icon: ShoppingCart,
    path: "/admin/orders",
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Manage Products",
    description: "View, edit, delete or add new products.",
    icon: PackageSearch,
    path: "/admin/products",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Categories & Brands",
    description: "Organize catalog structure & brands.",
    icon: Layers,
    path: "/admin/categories",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Manage Coupons",
    description: "Create, activate & track coupon usage.",
    icon: TicketPercent,
    path: "/admin/coupons",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Admin Logs",
    description: "Track all admin actions and activities.",
    icon: Clock,
    path: "/admin/logs",
    color: "from-red-500 to-rose-500",
  }
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Control Center
        </h1>
        <p className="text-gray-600 mb-10">
          Choose a section to manage the platform efficiently.
        </p>

        {/* Grid Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className="
                  cursor-pointer bg-white rounded-2xl shadow-card p-6
                  hover:shadow-glow transition-base group
                "
              >
                {/* Icon container */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color}
                    flex items-center justify-center shadow-soft mb-4
                    group-hover:scale-105 transition-transform
                  `}
                >
                  <Icon className="text-white" size={28} />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  {item.description}
                </p>

                <button className="
                  mt-4 text-sm font-medium text-primary group-hover:underline
                ">
                  Open →
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
