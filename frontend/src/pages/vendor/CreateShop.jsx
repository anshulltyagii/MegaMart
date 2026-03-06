import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CreateShop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/shops", {
        name: form.name,
        description: form.description,
        address: form.address,
      });

      alert("Shop created successfully!");
      navigate(`/vendor/shops/${res.data.id}`);
    } catch (err) {
      alert(err?.response?.data || "Unable to create shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Shop</h2>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Shop Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={update}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter shop name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Describe your shop"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={update}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Shop address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
        >
          {loading ? "Creating..." : "Create Shop"}
        </button>
      </form>
    </div>
  );
}