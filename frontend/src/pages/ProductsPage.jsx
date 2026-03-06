import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/common/ProductCard";
import { productAPI } from "../services/api";

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const category = params.get("category") || params.get("categoryId") || null;
  const search = params.get("search") || null;
  const page = Number(params.get("page") || 0);
  const size = Number(params.get("size") || 200);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const queryParams = { page, size };

    if (category) queryParams.categoryId = category;
    if (search) queryParams.q = search;

    productAPI
      .getAll(queryParams)
      .then((res) => {
        if (!mounted) return;

        const payload = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(payload) ? payload : [];

        // Shuffle products to random order
        const shuffled = list
          .map((p) => ({ p, r: Math.random() }))
          .sort((a, b) => a.r - b.r)
          .map((o) => o.p);

        setProducts(shuffled);
        setCount(shuffled.length);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        if (mounted) setProducts([]);
      })
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [category, search, page, size]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <div className="text-sm text-gray-600">{count} results</div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-lg font-semibold text-gray-600">
          Loading products...
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7"
        >
          {products.map((p, i) => (
            <div
              key={p.id}
              style={{ animation: `fadeIn 0.4s ease ${(i * 40) / 1000}s both` }}
              className="
                transition-all duration-300 
                hover:scale-[1.05] 
                hover:shadow-xl 
                hover:shadow-indigo-100 
                rounded-2xl 
                cursor-pointer
              "
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
