import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PlusCircle, Settings, Eye, Image, Layers } from "lucide-react";
import api from "../../services/api";

export default function ShopDetails() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShop();
    loadProducts();
  }, [shopId]);

  const loadShop = async () => {
    try {
      const res = await api.get(`/shops/${shopId}`);
      setShop(res.data);
    } catch (err) {
      setError("Failed to load shop details");
    } finally {
      setLoadingShop(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get(`/products/shop/${shopId}`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  if (loadingShop) {
    return <div className="p-6 text-lg">Loading shop...</div>;
  }

  if (!shop) {
    return <div className="p-6 text-lg text-red-600">Shop not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{shop.name}</h2>
          <p className="text-sm text-gray-600">{shop.description}</p>
          {shop.address && (
            <p className="text-xs text-gray-500 mt-1">📍 {shop.address}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/vendor/shops/${shopId}/edit`)}
            className="px-4 py-2 rounded-lg border flex gap-2 items-center"
          >
            <Settings size={16} />
            Edit Shop
          </button>

          <button
            onClick={() => navigate(`/vendor/products/add?shopId=${shopId}`)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
          >
            <PlusCircle size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Products ({products.length})</h3>

        {loadingProducts ? (
          <div>Loading products...</div>
        ) : products.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <p className="mb-4 text-gray-600">No products found for this shop.</p>
            <button
              onClick={() => navigate(`/vendor/products/add?shopId=${shopId}`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusCircle size={18} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-4 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold mb-1">{p.name}</h4>
                    <p className="text-sm text-gray-600">
                      ₹{p.sellingPrice}{" "}
                      {p.mrp > p.sellingPrice && (
                        <span className="line-through text-gray-400 ml-2">
                          ₹{p.mrp}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status:{" "}
                      <span
                        className={
                          p.active ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>

                  {p.thumbnail && (
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate(`/vendor/products/${p.id}/edit`)}
                    className="px-3 py-2 border rounded text-sm flex items-center gap-1"
                  >
                    <Settings size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => navigate(`/vendor/products/${p.id}/images`)}
                    className="px-3 py-2 border rounded text-sm flex items-center gap-1"
                  >
                    <Image size={16} />
                    Images
                  </button>

                  <button
                    onClick={() => navigate(`/vendor/products/${p.id}/variants`)}
                    className="px-3 py-2 border rounded text-sm flex items-center gap-1"
                  >
                    <Layers size={16} />
                    Variants
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}