import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import api from "../../services/api";

export default function EditShop() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState({
    name: "",
    description: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------
  // FETCH SHOP DETAILS
  // ------------------------------
  useEffect(() => {
    const loadShop = async () => {
      try {
        const res = await api.get(`/shops/${shopId}`);
        setShop(res.data);
      } catch (err) {
        setError("Failed to load shop details.");
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [shopId]);

  // ------------------------------
  // UPDATE LOCAL FORM STATE
  // ------------------------------
  const handleChange = (e) => {
    setShop({ ...shop, [e.target.name]: e.target.value });
  };

  // ------------------------------
  // SAVE UPDATED SHOP
  // ------------------------------
  const handleSave = async () => {
    setError("");

    if (!shop.name.trim()) {
      setError("Shop name cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/shops/${shopId}`, {
        name: shop.name,
        description: shop.description,
        address: shop.address,
      });

      alert("Shop updated successfully!");
      navigate(`/vendor/shops/${shopId}`);
    } catch (err) {
      console.log(err);
      setError("Failed to update shop.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------
  // LOADING STATE
  // ------------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 size={34} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-2">Edit Shop</h1>
      <p className="text-gray-600 mb-6">
        Update your shop details to make your store look more professional.
      </p>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* FORM */}
      <div className="bg-white shadow-md rounded-xl p-6 space-y-5 border">

        {/* Shop Name */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Shop Name</label>
          <input
            type="text"
            name="name"
            value={shop.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition"
            placeholder="Enter shop name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Description</label>
          <textarea
            name="description"
            value={shop.description}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition"
            placeholder="Write about your shop"
          ></textarea>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-semibold mb-1 block">Shop Address</label>
          <input
            type="text"
            name="address"
            value={shop.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition"
            placeholder="Enter shop address"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={20} /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
