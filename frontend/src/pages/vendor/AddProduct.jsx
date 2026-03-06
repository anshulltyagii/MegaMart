import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function AddProduct() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shopId = params.get("shopId");

  const [form, setForm] = useState({
    name: "",
    description: "",
    mrp: "",
    sellingPrice: "",
    stock: "",
    brand: "",
    categoryId: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!shopId) return alert("Shop ID missing!");

    if (Number(form.sellingPrice) > Number(form.mrp)) {
      return alert("Selling price cannot be higher than MRP!");
    }

    setLoading(true);
    try {
      const payload = {
        shopId: Number(shopId),
        categoryId: Number(form.categoryId),

        sku: form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),

        name: form.name,

        shortDescription: form.description.slice(0, 120),
        description: form.description,

        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),

        isActive: true,
      };

      const res = await api.post("/products", payload);

      navigate(`/vendor/products/${res.data.id}/images`);
    } catch (err) {
      alert(err?.response?.data || "Unable to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6">Add New Product</h2>

      <form
        onSubmit={submit}
        className="space-y-8 bg-white p-8 rounded-2xl shadow-lg border"
      >
        {/* =================== BASIC INFO =================== */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NAME */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={update}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
                placeholder="Product name"
              />
            </div>

            {/* BRAND */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={update}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
                placeholder="Ex. Apple, Nike"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              required
              rows={3}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
              placeholder="Describe your product..."
            />
          </div>
        </div>

        {/* =================== PRICING =================== */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">MRP *</label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={update}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Selling Price *
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={update}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={update}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* =================== CATEGORY =================== */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Category *</h3>

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={update}
            required
            className="w-full px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select Category</option>
            <option value="1">Fashion</option>
            <option value="2">Makeup</option>
            <option value="3">Electronics</option>
            <option value="4">Men</option>
            <option value="5">Women</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}