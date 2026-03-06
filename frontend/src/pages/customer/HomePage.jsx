// src/pages/customer/HomePage.jsx
import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { productAPI, categoryAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ProductCard from "../../components/common/ProductCard";

import {
  Laptop,
  Smartphone,
  Watch,
  Shirt,
  ShoppingBag,
  Home,
  Gem,
  Camera,
  Cpu,
  Headphones,
  Baby,
  Briefcase,
  Footprints,
  Brush,
  Sparkles
} from "lucide-react";

const CATEGORY_ICONS = {
  "Electronics": Laptop,
  "Mobiles": Smartphone,
  "Smartphones": Smartphone,
  "Fashion": Shirt,
  "Men": Shirt,
  "Women": ShoppingBag,
  "Accessories": Watch,
  "Home Decor": Home,
  "Beauty": Brush,
  "Makeup": Sparkles,
  "Jewelry": Gem,
  "Cameras": Camera,
  "Computers": Cpu,
  "Audio": Headphones,
  "Kids": Baby,
  "Bags": Briefcase,
  "Footwear": Footprints,
};

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [bestSellers, setBestSellers] = useState([]);
  const [recentViewed, setRecentViewed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------
  // Load Best Sellers (Random 1–2 per category)
  // --------------------------------------------------------
  const loadBestSellers = async () => {
    try {
      const res = await productAPI.getAll({ page: 0, size: 200 });
      const allProducts = res.data?.data || res.data || [];

      const categoriesMap = {};
      allProducts.forEach((p) => {
        if (!categoriesMap[p.categoryId]) {
          categoriesMap[p.categoryId] = [];
        }
        categoriesMap[p.categoryId].push(p);
      });

      let selected = [];
      Object.values(categoriesMap).forEach((list) => {
        if (!list.length) return;
        const pick = Math.min(2, list.length);
        for (let i = 0; i < pick; i++) {
          const randomIndex = Math.floor(Math.random() * list.length);
          selected.push(list[randomIndex]);
        }
      });

      selected = selected.sort(() => Math.random() - 0.5);
      setBestSellers(selected.slice(0, 8));
    } catch (e) {
      console.error("Failed best sellers:", e);
    }
  };

  // --------------------------------------------------------
  // Load Recently Viewed (Only logged-in)
  // --------------------------------------------------------
  const loadRecentlyViewed = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await productAPI.getRecentlyViewed?.(10);
      const data = res?.data?.data || res?.data || [];
      setRecentViewed(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed recently viewed:", e);
    }
  };

  // --------------------------------------------------------
  // Load All Products (for category thumbnails)
  // --------------------------------------------------------
  const loadAllProducts = async () => {
    try {
      const res = await productAPI.getAll({ page: 0, size: 500 });
      const list = res.data?.data || res.data || [];
      setAllProducts(list);
    } catch (err) {
      console.error("Failed to load all products:", err);
    }
  };

  // Choose random product image for category
  const getCategoryImage = (catId) => {
    if (!allProducts.length) return null;

    const filtered = allProducts.filter((p) => p.categoryId === catId);
    if (!filtered.length) return null;

    const randomProduct =
      filtered[Math.floor(Math.random() * filtered.length)];

    return (
      randomProduct.image ||
      randomProduct.thumbnail ||
      (randomProduct.images?.length && randomProduct.images[0]?.imagePath) ||
      null
    );
  };

  // --------------------------------------------------------
  // Load Categories
  // --------------------------------------------------------
  const loadCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // --------------------------------------------------------
  // Initial Page Load
  // --------------------------------------------------------
  useEffect(() => {
    (async () => {
      await loadBestSellers();
      await loadRecentlyViewed();
      await loadCategories();
      await loadAllProducts();
      setLoading(false);
    })();
  }, []);

  // --------------------------------------------------------
  // Loader
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
  <div className="min-h-screen bg-gray-100">

    {/* ========================================================= */}
    {/*                      HERO SECTION                         */}
    {/* ========================================================= */}
    <section className="relative max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div
        className="
          relative rounded-[32px] overflow-hidden h-[460px]
          shadow-2xl group cursor-pointer
          transition-all duration-700
        "
      >
        {/* Background Image with Parallax */}
        <img
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80"
          className="
            absolute inset-0 w-full h-full object-cover 
            transition-transform duration-1000 
            group-hover:scale-110
          "
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

        {/* Hero Text */}
        <div className="absolute left-10 bottom-10 text-white max-w-xl animate-fadeInBlur">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-2xl">
            Elevate Your Lifestyle.
          </h1>
          <p className="mt-3 text-lg opacity-90">
            Discover premium luxury products curated just for you.
          </p>

          <button
            onClick={() => navigate("/products")}
            className="
              mt-6 px-10 py-3 rounded-full font-bold
              bg-white text-black shadow-xl
              hover:bg-gray-200 hover:shadow-2xl
              transition-all duration-300
            "
          >
            Shop Now →
          </button>
        </div>
      </div>
    </section>
{/* ================= CATEGORIES ================= */}
<section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
    Shop by Categories
  </h2>

  <div
    className="
      grid 
      grid-cols-2 
      sm:grid-cols-3 
      md:grid-cols-4 
      xl:grid-cols-5
      gap-8 
      justify-center
    "
  >
    {categories.map((cat) => {
      const Icon = CATEGORY_ICONS[cat.name] || ShoppingBag;

      return (
        <div
          key={cat.id}
          onClick={() => navigate(`/products?category=${cat.id}`)}
          className="
            group cursor-pointer bg-white 
            rounded-3xl
            shadow-sm p-8 
            w-full 
            max-w-[220px]
            flex flex-col items-center 
            mx-auto
            transition-all duration-300
            hover:shadow-xl hover:-translate-y-1
          "
        >
          <div
            className="
              h-24 w-24 rounded-full 
              bg-gray-100 
              flex items-center justify-center 
              mb-4
              group-hover:bg-indigo-50
              transition-all duration-300
            "
          >
            <Icon
              size={48}
              className="text-gray-700 group-hover:text-indigo-600 transition-colors"
            />
          </div>

          <h3
            className="
              text-gray-800 
              font-semibold 
              text-lg 
              text-center
              group-hover:text-indigo-600
              transition-all
            "
          >
            {cat.name}
          </h3>
        </div>
      );
    })}
  </div>
</section>




    {/* ========================================================= */}
    {/*                    BEST SELLERS                         */}
    {/* ========================================================= */}
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-bold text-gray-900">Best Sellers</h2>

        <button
          onClick={() => navigate("/products")}
          className="
            flex items-center gap-2 px-5 py-2 font-semibold
            text-indigo-600 border border-indigo-500 rounded-full
            hover:bg-indigo-600 hover:text-white
            transition-all duration-300
          "
        >
          View All <ArrowRight size={20} />
        </button>
      </div>

      {/* Product Grid */}
      <div className="
        grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 
        gap-8
      ">
        {bestSellers.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>

    {/* ========================================================= */}
    {/*                    RECENTLY VIEWED                       */}
    {/* ========================================================= */}
    {isAuthenticated && recentViewed.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-10">
          Recently Viewed
        </h2>

        <div className="
          grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
          gap-8
        ">
          {recentViewed.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    )}

    <div className="py-10" />
  </div>
);

};

export default HomePage;
