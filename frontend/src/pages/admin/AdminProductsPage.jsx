import React, { useEffect, useMemo, useState } from "react";
import { productAPI, shopkeeperAPI } from "../../services/api";
import {
  Edit3,
  Trash2,
  Plus,
  Search,
  Package,
  BarChart3,
} from "lucide-react";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("ALL");

  const [editProduct, setEditProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // LOAD ALL PRODUCTS
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({ size: 5000 });
      const list = res.data?.content || res.data || [];
      setProducts(list);
      setFiltered(list);
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // UNIQUE SHOP IDS
  const shopOptions = useMemo(() => {
    const ids = Array.from(new Set(products.map((p) => p.shopId)));
    return ids.sort((a, b) => a - b);
  }, [products]);

  // FILTERS
  useEffect(() => {
    let list = [...products];

    if (shopFilter !== "ALL") {
      list = list.filter((p) => String(p.shopId) === String(shopFilter));
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }

    setFiltered(list);
  }, [search, shopFilter, products]);

  // ANALYTICS
  const analytics = useMemo(() => {
    const total = products.length;

    const perShop = {};
    products.forEach((p) => {
      if (!perShop[p.shopId]) perShop[p.shopId] = 0;
      perShop[p.shopId] += 1;
    });

    const totalSalesValue = products.reduce(
      (sum, p) => sum + (p.sellingPrice || 0),
      0
    );

    return { total, perShop, totalSalesValue };
  }, [products]);

  // DELETE PRODUCT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await shopkeeperAPI.products.delete(id);
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin – Products</h1>
          <p className="text-gray-600">Manage all products from all shops.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Package className="text-indigo-600" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Products</p>
            <p className="text-xl font-bold">{analytics.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <BarChart3 className="text-amber-600" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sum of Selling Prices</p>
            <p className="text-xl font-bold">
              ₹{analytics.totalSalesValue.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* PREMIUM GRAPH */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow border">
        <p className="text-md font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          Products per Shop
        </p>

        <div className="space-y-4">
          {Object.entries(analytics.perShop).map(([shopId, count]) => {
            const width =
              analytics.total === 0
                ? 0
                : Math.round((count / analytics.total) * 100);

            return (
              <div key={shopId} className="space-y-1">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Shop #{shopId}</span>
                  <span className="font-medium">
                    {count} products ({width}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Search */}
        <div className="flex items-center border rounded-lg px-3 py-2 w-full md:w-80 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            className="ml-2 flex-1 outline-none text-sm"
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Shop Filter */}
        <select
          className="border rounded-lg px-3 py-2 text-sm shadow-sm"
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
        >
          <option value="ALL">All Shops</option>
          {shopOptions.map((id) => (
            <option key={id} value={id}>
              Shop #{id}
            </option>
          ))}
        </select>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No products found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-700">
                <th className="p-3">ID</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Name</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Updated</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.sku}</td>
                  <td className="p-3 max-w-xs truncate">{p.name}</td>
                  <td className="p-3 font-semibold">₹{p.sellingPrice}</td>
                  <td className="p-3 text-gray-500">₹{p.mrp}</td>
                  <td className="p-3">Shop #{p.shopId}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {p.updatedAt || p.createdAt || "-"}
                  </td>

                  <td className="p-3">
                    {p.isActive ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      className="inline-flex items-center gap-1 text-indigo-600 mr-3"
                      onClick={() => setEditProduct(p)}
                    >
                      <Edit3 size={16} /> Edit
                    </button>

                    <button
                      className="inline-flex items-center gap-1 text-red-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSaved={loadProducts}
        />
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;

/* =======================================================================
   EDIT PRODUCT MODAL
======================================================================== */

const EditProductModal = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState({
    shopId: product.shopId || "",
    categoryId: product.categoryId || "",
    sku: product.sku || "",
    name: product.name || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    sellingPrice: product.sellingPrice || "",
    mrp: product.mrp || "",
    isActive: product.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await shopkeeperAPI.products.update(product.id, {
        ...form,
        shopId: Number(form.shopId),
        categoryId: Number(form.categoryId),
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),
      });

      alert("Product Updated");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">Edit Product #{product.id}</h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Shop ID</label>
              <input
                name="shopId"
                value={form.shopId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Category ID
              </label>
              <input
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">SKU</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Short Description
            </label>
            <input
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Selling Price
              </label>
              <input
                name="sellingPrice"
                type="number"
                value={form.sellingPrice}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">MRP</label>
              <input
                name="mrp"
                type="number"
                value={form.mrp}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="isActiveEdit"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="isActiveEdit" className="text-sm">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =======================================================================
   ADD PRODUCT MODAL
======================================================================== */

const AddProductModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    shopId: "",
    categoryId: "",
    sku: "",
    name: "",
    shortDescription: "",
    description: "",
    sellingPrice: "",
    mrp: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await shopkeeperAPI.products.create({
        ...form,
        shopId: Number(form.shopId),
        categoryId: Number(form.categoryId),
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),
      });

      alert("Product Created");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-h-[70vh] overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Shop ID
              </label>
              <input
                name="shopId"
                value={form.shopId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Category ID
              </label>
              <input
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">SKU</label>
              <input
                name="sku"
                value={form.sku ?? ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Short Description
            </label>
            <input
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Selling Price
              </label>
              <input
                name="sellingPrice"
                type="number"
                value={form.sellingPrice}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">MRP</label>
              <input
                name="mrp"
                type="number"
                value={form.mrp}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="isActiveAdd"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="isActiveAdd" className="text-sm">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
