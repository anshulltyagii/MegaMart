import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_HOST = "http://localhost:9192";

const currency = (v) => (v ? `₹${v.toLocaleString()}` : "");

export default function ProductCard({ product }) {
  const { user, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";

  // Extract image path
  const rawPath =
    product.image ||
    product.thumbnail ||
    (product.images && product.images.length && product.images[0].imagePath) ||
    null;

  let imgSrc = "/placeholder.png";
  if (rawPath) {
    imgSrc = rawPath.startsWith("http")
      ? rawPath
      : `${API_HOST}${rawPath.startsWith("/") ? rawPath : "/" + rawPath}`;
  }

  return (
    <div
      className="
        relative group 
        rounded-xl overflow-hidden 
        bg-white border border-gray-100 
        shadow-sm hover:shadow-xl 
        transition-all duration-300
      "
    >
      {/* CLICK WRAPS THE WHOLE CARD */}
      <Link to={`/product/${product.id}`}>
        {/* IMAGE */}
        <div className="h-64 bg-white flex items-center justify-center overflow-hidden relative">
          <img
            src={imgSrc}
            alt={product.name}
            className="
              object-contain w-full h-full p-4
              group-hover:scale-105 transition-transform duration-500
            "
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        </div>

        {/* DETAILS */}
        <div className="p-5">
          <div className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {product.name}
          </div>

          {product.shortDescription && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">
              {product.shortDescription}
            </div>
          )}

          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">
                {currency(product.sellingPrice)}
              </div>
              {product.mrp && product.mrp > product.sellingPrice && (
                <div className="text-xs text-gray-400 line-through">
                  {currency(product.mrp)}
                </div>
              )}
            </div>

            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                {Math.round(
                  ((product.mrp - product.sellingPrice) / product.mrp) * 100
                )}
                % OFF
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ⭐ CUSTOMER ONLY BUTTONS */}
      {isCustomer && (
        <div
          className="
            absolute bottom-3 left-0 right-0
            flex justify-center gap-3
            opacity-0 group-hover:opacity-100
            translate-y-4 group-hover:translate-y-0
            transition-all duration-300
            pointer-events-auto
          "
        >
          {/* Add to Cart */}
          <button
            onClick={(e) => {
              e.preventDefault(); // prevents navigating to product page
              e.stopPropagation();
              console.log("ADD TO CART:", product.id);
            }}
            className="
              flex items-center gap-2
              bg-indigo-600 hover:bg-indigo-700
              text-white text-xs font-semibold
              px-3 py-2 rounded-full shadow-lg
              transition-all
            "
          >
            <ShoppingCart size={14} /> Add
          </button>

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("ADD TO WISHLIST:", product.id);
            }}
            className="
              flex items-center gap-2
              bg-white hover:bg-gray-100
              border border-gray-300
              text-gray-700 text-xs font-semibold
              px-3 py-2 rounded-full shadow
              transition-all
            "
          >
            <Heart size={14} className="text-red-500" /> Wish
          </button>
        </div>
      )}
    </div>
  );
}
