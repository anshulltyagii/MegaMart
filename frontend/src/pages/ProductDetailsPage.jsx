import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Check,
  Plus,
  Minus,
  Share2,
  ChevronRight,
} from "lucide-react";
import api, { variantAPI } from "../services/api"; // ⬅️ add variantAPI import
import { useAuth } from "../context/AuthContext";
import ReviewsSection from "../components/reviews/ReviewsSection";

// Helper to construct image URL
const BASE_URL = "http://localhost:9192";
const getImageUrl = (path) => {
  if (!path) return "https://via.placeholder.com/600?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { refreshCartCount } = useAuth();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // 🔹 NEW: variant state
  const [variantGroups, setVariantGroups] = useState([]); // [{id, groupName}]
  const [valuesByGroup, setValuesByGroup] = useState({}); // { groupId: [values] }
  const [variantStock, setVariantStock] = useState([]); // [{variantValueId, quantity, priceOffset}]
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // product + images + reviews (existing)
        const productRes = await api.get(`/products/${productId}`);
        setProduct(productRes.data);

        const imgRes = await api.get(`/products/${productId}/images`);
        const imgList = imgRes.data?.data || imgRes.data || [];
        setImages(imgList);

        const reviewRes = await api.get(`/reviews/newest/${productId}`);
        setReviews(reviewRes.data || []);

        // 🔹 NEW: variants (safe – agar error aaya to UI nahi todegi)
        try {
          const [groupsRes, stockRes] = await Promise.all([
            variantAPI.getGroups(productId),
            variantAPI.getStock(productId),
          ]);

          const groupsData = Array.isArray(groupsRes.data)
            ? groupsRes.data
            : groupsRes.data?.data || [];
          const stockData = Array.isArray(stockRes.data)
            ? stockRes.data
            : stockRes.data?.data || [];

          setVariantGroups(groupsData);
          setVariantStock(stockData);

          // har group ke liye values load karo (simple version)
          for (const g of groupsData) {
            try {
              const valsRes = await variantAPI.getValues(productId, g.id);
              const valsData = Array.isArray(valsRes.data)
                ? valsRes.data
                : valsRes.data?.data || [];
              setValuesByGroup((prev) => ({ ...prev, [g.id]: valsData }));
            } catch (e) {
              console.warn("Error loading values for group", g.id, e);
            }
          }

          // default selected variant: pehle jiska stock > 0 ho
          const firstWithStock = stockData.find(
            (s) => (s.quantity ?? s.qty ?? 0) > 0
          );
          if (firstWithStock) {
            setSelectedVariantId(
              firstWithStock.variantValueId ??
                firstWithStock.valueId ??
                firstWithStock.variant_value_id
            );
          }
        } catch (variantErr) {
          console.warn("Variant API error:", variantErr);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [productId]);

  // helper: selected variant ka stock + priceOffset
  const selectedStockEntry =
    selectedVariantId != null
      ? variantStock.find(
          (s) =>
            (s.variantValueId ?? s.valueId ?? s.variant_value_id) ===
            selectedVariantId
        )
      : null;

  const currentImageSrc =
    images.length > 0
      ? getImageUrl(images[selectedImageIndex]?.imagePath)
      : "https://via.placeholder.com/600?text=No+Image";

  // 🔹 base + variant price offset
  const baseSelling = product?.sellingPrice || 0;
  const priceOffsetRaw = selectedStockEntry?.priceOffset ?? 0;
  const priceOffset =
    typeof priceOffsetRaw === "string"
      ? Number(priceOffsetRaw)
      : Number(priceOffsetRaw || 0);
  const effectiveSellingPrice =
    baseSelling + (isNaN(priceOffset) ? 0 : priceOffset);

  const mrp = product?.mrp || 0;
  const effectivePriceForDiscount = effectiveSellingPrice || baseSelling;

  const discount =
    mrp && effectivePriceForDiscount
      ? Math.round(((mrp - effectivePriceForDiscount) / mrp) * 100)
      : 0;

  const maxQtyFromStock =
    selectedStockEntry && selectedStockEntry.quantity != null
      ? Number(selectedStockEntry.quantity)
      : 10; // agar variants nahi ya stock info nahi to purana 10 limit

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: `/product/${productId}` } });
        return;
      }

      // OPTIONAL: require variant if variants exist
      if (variantGroups.length > 0 && !selectedVariantId) {
        alert("Please select a variant first.");
        return;
      }

      await api.post("/cart/items", {
        productId: parseInt(productId),
        quantity: quantity,
        // ⬇️ agar backend cart me support hai to use karlena
        variantValueId: selectedVariantId || null,
      });

      if (refreshCartCount) await refreshCartCount();

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      const reason =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to add item to cart.";
      alert(reason);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return navigate("/login");

      const userId = localStorage.getItem("userId");
      if (!userId) return;

      if (isWishlisted) {
        await api.delete("/wishlist/remove", {
          data: { userId: parseInt(userId), productId: parseInt(productId) },
        });
      } else {
        await api.post("/wishlist/add", {
          userId: parseInt(userId),
          productId: parseInt(productId),
        });
      }
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product not found
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="text-indigo-600 font-bold"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {showNotification && (
        <div className="fixed top-24 right-8 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <Check size={24} />
            <span className="font-bold">Added to cart successfully!</span>
          </div>
        </div>
      )}

      {/* Breadcrumb (EXISTING) */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
              className="cursor-pointer hover:text-indigo-600"
              onClick={() => navigate("/")}
            >
              Home
            </span>
            <ChevronRight size={16} />
            <span
              className="cursor-pointer hover:text-indigo-600"
              onClick={() => navigate("/products")}
            >
              Products
            </span>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details (EXISTING + variants block) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT IMAGES (EXISTING) */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm group border border-gray-100">
              <img
                src={currentImageSrc}
                alt={product.name}
                className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/600?text=Image+Error";
                }}
              />

              <button
                onClick={handleAddToWishlist}
                className={`absolute top-6 right-6 w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all ${
                  isWishlisted
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart
                  size={24}
                  fill={isWishlisted ? "currentColor" : "none"}
                />
              </button>

              {discount > 0 && (
                <div className="absolute top-6 left-6 bg-green-500 text-white px-3 py-1 rounded-lg font-bold shadow-md text-sm">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails (EXISTING) */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, index) => (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white ${
                      selectedImageIndex === index
                        ? "border-indigo-600 ring-2 ring-indigo-100"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <img
                      src={getImageUrl(img.imagePath)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT DETAILS (EXISTING + variants) */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-500 text-lg">
                {product.shortDescription}
              </p>
            </div>

            {/* PRICE + VARIANTS CARD */}
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-5xl font-bold text-gray-900">
                  ₹{effectivePriceForDiscount.toLocaleString()}
                </span>

                {mrp > effectivePriceForDiscount && (
                  <>
                    <span className="text-2xl text-gray-400 line-through">
                      ₹{mrp.toLocaleString()}
                    </span>
                    <span className="text-lg font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                      Save ₹{(mrp - effectivePriceForDiscount).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* 🔹 NEW: Variant selector */}
              {variantGroups.length > 0 && (
                <div className="mb-6 space-y-3">
                  {variantGroups.map((g) => (
                    <div key={g.id}>
                      <span className="font-semibold text-gray-700 block mb-2">
                        {g.groupName}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(valuesByGroup[g.id] || []).map((v) => {
                          const stockEntry = variantStock.find(
                            (s) =>
                              (s.variantValueId ??
                                s.valueId ??
                                s.variant_value_id) === v.id
                          );
                          const qty =
                            stockEntry?.quantity ?? stockEntry?.qty ?? 0;
                          const outOfStock = !stockEntry || qty <= 0;
                          const isSelected = selectedVariantId === v.id;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              disabled={outOfStock}
                              onClick={() => {
                                setSelectedVariantId(v.id);
                                setQuantity(1);
                              }}
                              className={`px-4 py-2 rounded-full text-sm border transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-gray-800 border-gray-300 hover:border-indigo-400"
                              } ${
                                outOfStock
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {v.valueName}
                              {outOfStock && " (Out of stock)"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                {/* {selectedStockEntry && (
                //     <p className="text-sm text-gray-600 mt-1">
                //       In stock: {selectedStockEntry.quantity}
                //     </p>
                  )} */}
                  {!selectedStockEntry &&
                    variantGroups.length > 0 &&
                    (valuesByGroup[variantGroups[0].id] || []).length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Please select a variant.
                      </p>
                    )}
                </div>
              )}

              {/* Quantity Selector (EXISTING, but max stock respected) */}
              <div className="flex items-center gap-6 mb-6">
                <span className="font-semibold text-gray-700">Quantity</span>

                <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-gray-200 rounded-l-lg transition"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="px-4 font-bold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(maxQtyFromStock || 10, q + 1))
                    }
                    className="px-4 py-2 hover:bg-gray-200 rounded-r-lg transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {selectedStockEntry && (
                  <span className="text-xs text-gray-500">
                    Max {maxQtyFromStock} items available
                  </span>
                )}
              </div>

              {/* Add to Cart (EXISTING) */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart || (selectedStockEntry && maxQtyFromStock <= 0)
                  }
                  className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  {addingToCart
                    ? "Adding..."
                    : selectedStockEntry && maxQtyFromStock <= 0
                    ? "Out of stock"
                    : "Add to Cart"}
                </button>

                <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                  <Share2 size={24} />
                </button>
              </div>
            </div>

            {/* Description (EXISTING) */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                About this item
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || "No detailed description available."}
              </p>
            </div>

            {/* Trust Badges (EXISTING) */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="text-center">
                <Truck className="mx-auto mb-2 text-indigo-600" size={28} />
                <p className="text-sm font-semibold">Free Delivery</p>
              </div>
              <div className="text-center">
                <ShieldCheck
                  className="mx-auto mb-2 text-indigo-600"
                  size={28}
                />
                <p className="text-sm font-semibold">Secure Payment</p>
              </div>
              <div className="text-center">
                <RefreshCcw
                  className="mx-auto mb-2 text-indigo-600"
                  size={28}
                />
                <p className="text-sm font-semibold">7 Days Return</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ REVIEWS SECTION (EXISTING) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <ReviewsSection productId={productId} />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
