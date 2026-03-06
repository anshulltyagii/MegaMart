import React, { useEffect, useState } from "react";
import { shopAPI } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Eye, PlusCircle, Store } from "lucide-react";

export default function MyShops() {
  const [shops, setShops] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shopAPI.getMyShops();
        setShops(res.data || []);
      } catch (err) {
        console.error("Failed to load shops", err);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">My Shops</h2>
          <p className="text-gray-600 mt-1">Manage all your shop listings</p>
        </div>

        <button
          onClick={() => navigate("/vendor/shops/create")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          <PlusCircle size={20} />
          Create New Shop
        </button>
      </div>

      {/* Empty State */}
      {shops.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <Store size={80} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">
            No Shops Found
          </h3>
          <p className="text-gray-500 mt-1 mb-4">
            Start your business by creating your first shop.
          </p>

          <button
            onClick={() => navigate("/vendor/shops/create")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md"
          >
            <PlusCircle size={20} />
            Create Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-white"
            >
              {/* Shop Info */}
              <h3 className="text-xl font-semibold">{shop.name}</h3>
              <p className="text-gray-600 mt-1 line-clamp-2">
                {shop.description || "No description"}
              </p>

              {/* Status */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    shop.isApproved
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {shop.isApproved ? "Approved" : "Pending"}
                </span>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    shop.isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {shop.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/vendor/shops/${shop.id}`)}
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <Eye size={18} /> View
                </button>

                <button
                  onClick={() => navigate(`/vendor/shops/${shop.id}/edit`)}
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <Edit size={18} /> Edit
                </button>

                <button
                  onClick={() =>
                    navigate(`/vendor/products/add?shopId=${shop.id}`)
                  }
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <PlusCircle size={18} /> Add Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}