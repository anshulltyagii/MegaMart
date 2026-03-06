import React, { useEffect, useState } from "react";
import { addressAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Edit, Trash, Star, MapPin, Phone, User } from "lucide-react";

export default function AddressListPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);

  const loadAddresses = () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      navigate("/login");
      return;
    }

    addressAPI
      .getAll(userId)
      .then((res) => setAddresses(res.data || res.data?.data || []))
      .catch((err) => console.error("Address load error:", err));
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSetDefault = async (id) => {
    const userId = localStorage.getItem("userId");

    try {
      await addressAPI.setDefault(id, userId);
      loadAddresses();
    } catch (err) {
      console.error("Default address error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;

    const userId = localStorage.getItem("userId");

    try {
      await addressAPI.delete(id, userId);
      loadAddresses();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div
        className="
          max-w-4xl mx-auto p-8 rounded-3xl
          bg-white/70 backdrop-blur-2xl shadow-2xl border border-white/40
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            My Addresses
          </h2>

          <button
            onClick={() => navigate("/addresses/add")}
            className="
              px-5 py-3 rounded-2xl font-semibold text-white
              bg-gradient-to-r from-indigo-600 to-purple-600
              shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95
              transition-all
            "
          >
            + Add New Address
          </button>
        </div>

        {/* Address List */}
        <div className="space-y-6">
          {addresses.map((a, idx) => (
            <div
              key={a.id}
              className="
                p-6 rounded-2xl border border-gray-200 bg-white shadow-sm 
                hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                relative
              "
              style={{ animation: `fadeSlide 0.3s ease ${(idx + 1) * 0.06}s` }}
            >
              {/* Default Badge */}
              {a.isDefault && (
                <span
                  className="
                    absolute top-3 right-3 px-3 py-1.5 text-xs font-bold
                    rounded-full text-white bg-gradient-to-r 
                    from-indigo-600 to-purple-600 shadow-md
                  "
                >
                  DEFAULT
                </span>
              )}

              {/* Name & Phone */}
              <div className="flex items-center gap-4 mb-3">
                <div
                  className="
                    w-12 h-12 rounded-xl bg-indigo-600 text-white 
                    flex items-center justify-center text-lg shadow-lg
                  "
                >
                  <User size={22} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900">{a.fullName}</h3>
                  <p className="text-gray-600 flex items-center gap-1 text-sm mt-1">
                    <Phone size={15} /> {a.phone}
                  </p>
                </div>
              </div>

              {/* Address Details */}
              <div className="mt-4 pl-1">
                <p className="flex items-start gap-2 text-gray-700">
                  <MapPin size={18} className="mt-1 text-indigo-600" />
                  <span>
                    {a.addressLine1}
                    {a.addressLine2 && `, ${a.addressLine2}`}, {a.city},{" "}
                    {a.state} - {a.pincode}
                  </span>
                </p>

                {a.landmark && (
                  <p className="mt-2 text-gray-600 text-sm">
                    <span className="font-medium text-gray-700">Landmark:</span>{" "}
                    {a.landmark}
                  </p>
                )}

                <p className="mt-3 font-semibold text-indigo-600 text-sm uppercase tracking-wide">
                  {a.addressType}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6 mt-6">
                <button
                  onClick={() => navigate(`/addresses/edit/${a.id}`)}
                  className="
                    flex items-center gap-2 text-blue-600 font-medium 
                    hover:underline hover:scale-105 transition-transform
                  "
                >
                  <Edit size={18} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="
                    flex items-center gap-2 text-red-600 font-medium 
                    hover:underline hover:scale-105 transition-transform
                  "
                >
                  <Trash size={18} /> Delete
                </button>

                {!a.isDefault && (
                  <button
                    onClick={() => handleSetDefault(a.id)}
                    className="
                      flex items-center gap-2 text-indigo-600 font-medium 
                      hover:underline hover:scale-105 transition-transform
                    "
                  >
                    <Star size={18} /> Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {addresses.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No addresses found</p>
        )}
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
