import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, PlusCircle, Settings, Image, Layers } from "lucide-react";
import api from "../../services/api";

export default function ShopProducts() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const BASE_URL = "http://localhost:9192"; // backend root

  useEffect(() => {
    loadShop();
    loadProducts();
  }, [shopId]);

  // ------------------------------------------------
  // LOAD SHOP
  // ------------------------------------------------
  const loadShop = async () => {
    try {
      const res = await api.get(`/shops/${shopId}`);
      setShop(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------------------------------------
  // LOAD PRODUCTS + PRIMARY IMAGE
  // ------------------------------------------------
  const loadProducts = async () => {
    try {
      const res = await api.get(`/products/shop/${shopId}`);
      const list = Array.isArray(res.data) ? res.data : [];

      const updated = await Promise.all(
        list.map(async (p) => {
          try {
            const imgRes = await api.get(`/products/${p.id}/images`);
            const imgs = imgRes.data?.data || [];
            const primary = imgs.find((i) => i.primary) || imgs[0];

            return { ...p, imagePath: primary?.imagePath || null };
          } catch {
            return { ...p, imagePath: null };
          }
        })
      );

      setProducts(updated);
    } catch (err) {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // SEARCH LOGIC
  // ------------------------------------------------
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------------------------------------
  // FIX IMAGE URL
  // ------------------------------------------------
  const resolveImageUrl = (path, productId) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/product-images/")) return `${BASE_URL}${path}`;
    if (path.startsWith("product-images/")) return `${BASE_URL}/${path}`;
    const fileName = path.split("/").pop();
    return `${BASE_URL}/product-images/${productId}/${fileName}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Products</h2>
          <p className="text-sm text-gray-600 mt-1">
            Shop: <span className="font-semibold">{shop?.name}</span>
          </p>
        </div>

        <button
          onClick={() => navigate(`/vendor/products/add?shopId=${shopId}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow flex items-center gap-2 transition"
        >
          <PlusCircle size={18} /> Add Product
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-8 max-w-lg mx-auto">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full bg-white border border-gray-300 px-4 pl-12 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-lg font-medium text-gray-600 py-10">
          Loading products...
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredProducts.length === 0 && (
        <div className="border rounded-xl p-16 text-center bg-gray-50 shadow-sm">
          <p className="mb-4 text-gray-600 text-lg">No products found.</p>
          <button
            onClick={() => navigate(`/vendor/products/add?shopId=${shopId}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow flex items-center gap-2 mx-auto"
          >
            <PlusCircle size={18} /> Add First Product
          </button>
        </div>
      )}

      {/* TABLE */}
      {!loading && filteredProducts.length > 0 && (
        <div className="overflow-x-auto rounded-xl shadow border">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Product</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50 transition">

                  {/* IMAGE */}
                  <td className="p-4">
                    {p.imagePath ? (
                      <img
                        src={resolveImageUrl(p.imagePath, p.id)}
                        className="w-16 h-16 object-cover rounded-lg border shadow"
                        alt={p.name}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-xs border">
                        No Image
                      </div>
                    )}
                  </td>

                  {/* PRODUCT INFO */}
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-sm text-gray-500">
                      {p.description?.slice(0, 50)}...
                    </div>
                  </td>

                  {/* PRICING */}
                  <td className="p-4">
                    <div className="font-bold text-gray-800">₹{p.sellingPrice}</div>
                    {p.mrp > p.sellingPrice && (
                      <div className="text-xs text-gray-400 line-through">₹{p.mrp}</div>
                    )}
                  </td>

                  {/* STATUS - ✅ FIXED HERE */}
                  <td className="p-4">
                    <span
                      className={`font-semibold ${
                        p.isActive ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/vendor/products/${p.id}/edit`)}
                      className="px-4 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                    >
                      <Settings size={16} /> Edit
                    </button>

                    <button
                      onClick={() => navigate(`/vendor/products/${p.id}/images`)}
                      className="px-4 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                    >
                      <Image size={16} /> Images
                    </button>

                    <button
                      onClick={() => navigate(`/vendor/products/${p.id}/variants`)}
                      className="px-4 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                    >
                      <Layers size={16} /> Variants
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}