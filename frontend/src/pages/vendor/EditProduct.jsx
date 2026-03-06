import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { inventoryAPI } from "../../services/api";
import { CheckCircle, AlertCircle, X } from "lucide-react"; // ✅ Icons for Toast

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    mrp: "",
    sellingPrice: "",
    stock: "",
    categoryId: "",
    sku: "",
    shopId: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    loadData();
  }, [id]);

  const showToastMessage = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const productRes = await api.get(`/products/${id}`);
      const p = productRes.data;

      let stockValue = "";
      try {
        const invRes = await inventoryAPI.get(id);
        stockValue = invRes.data.quantity; 
      } catch (invErr) {
        console.warn("Inventory not found, defaulting to 0");
        stockValue = 0;
      }

      setForm({
        name: p.name || "",
        description: p.description || "",
        mrp: p.mrp || "",
        sellingPrice: p.sellingPrice || "",
        stock: stockValue,
        categoryId: p.categoryId || "",
        sku: p.sku || "",
        shopId: p.shopId,
        isActive: p.isActive,
      });
    } catch (err) {
      console.error(err);
      showToastMessage("Product not found!", "error");
      setTimeout(() => navigate("/vendor/home"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (Number(form.sellingPrice) > Number(form.mrp)) {
      showToastMessage("Selling price cannot be greater than MRP", "error");
      return;
    }

    setSaving(true);

    try {
      const productPayload = {
        id: Number(id),
        shopId: Number(form.shopId),
        categoryId: Number(form.categoryId),
        sku: form.sku,
        name: form.name,
        shortDescription: form.description.slice(0, 120),
        description: form.description,
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),
        isActive: form.isActive,
      };

await api.put(`/products/manage/${id}`, productPayload)

      const stockQty = parseInt(form.stock) || 0;
      await inventoryAPI.update(id, stockQty);

      // ✅ Success Toast instead of Alert
      showToastMessage("Product and Stock updated successfully!");
      
      // Delay navigation slightly so user sees the toast
      setTimeout(() => {
          navigate(`/vendor/shops/${form.shopId}/products`);
      }, 1500);
      
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.response?.data || "Failed to update product";
      showToastMessage(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-lg">Loading product...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 relative">
      
      {/* ✅ CUSTOM TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 animate-slide-in ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
            {toast.type === "success" ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <div>
                <h4 className="font-bold text-lg">{toast.type === "success" ? "Success" : "Error"}</h4>
                <p className="text-sm opacity-90">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 hover:bg-white/20 p-1 rounded-full">
                <X size={18} />
            </button>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6">Edit Product</h2>

      <form
        onSubmit={submit}
        className="space-y-8 bg-white p-8 rounded-2xl shadow-lg border"
      >
        {/* BASIC INFO */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                readOnly
                className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={3}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* PRICING */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">MRP *</label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={updateField}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Selling Price *</label>
              <input
                type="number"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={updateField}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={updateField}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* CATEGORY */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Category *</h3>

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={updateField}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          >
            <option value="">Select Category</option>
            <option value="1">Fashion</option>
            <option value="2">Makeup</option>
            <option value="3">Electronics</option>
            <option value="4">Men</option>
            <option value="5">Women</option>
          </select>
        </div>

        {/* IS ACTIVE */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <label className="text-sm font-medium">Active Product</label>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow hover:bg-indigo-700 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}