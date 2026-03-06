import { useEffect, useState } from "react";
import { wishlistAPI, cartAPI } from "../../services/api";
import { Heart, Trash2, ShoppingCart, Sparkles } from "lucide-react";

const API_HOST = "http://localhost:9192";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    loadWishlist();
  }, [userId]);

  const loadWishlist = () => {
    if (!userId) return;

    wishlistAPI
      .get(userId)
      .then((res) => setItems(res.data))
      .catch(console.error);
  };

  const removeItem = async (productId) => {
    try {
      await wishlistAPI.remove(userId, productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch {
      alert("Failed to remove item");
    }
  };

  const addToCart = async (productId) => {
    try {
      await cartAPI.addItem(productId, 1);
      await wishlistAPI.remove(userId, productId);
      loadWishlist();
      alert("Added to cart!");
    } catch {
      alert("Failed to add product");
    }
  };

  const getImage = (item) => {
    const raw =
      item.image ||
      item.productImage ||
      item.thumbnail ||
      (item.images?.length ? item.images[0].imagePath : null);

    if (!raw) return "/placeholder.jpg";
    if (raw.startsWith("http")) return raw;
    return `${API_HOST}${raw.startsWith("/") ? raw : "/" + raw}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-14 px-5 relative overflow-hidden">

      {/* 🌈 BACKGROUND GLOW EFFECT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-300/30 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* 🌟 ULTRA PREMIUM HEADER */}
        <div className="text-center mb-14 animate-fadeIn">

          {/* Floating Heart + Sparkles */}
          <div className="flex justify-center gap-3 mb-3 relative">
            <Heart size={50} className="text-pink-600 drop-shadow-xl animate-pulse-slow" />
            <Sparkles size={32} className="text-yellow-400 animate-bounce" />
          </div>

          {/* Title */}
          <h1
            className="
              text-5xl md:text-6xl font-extrabold tracking-wide
              bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900
              bg-clip-text text-transparent
              drop-shadow-md
            "
          >
            My Wishlist
          </h1>

          {/* Underline Accent */}
          <div className="mt-4 flex justify-center">
            <div className="w-28 h-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg"></div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-600 mt-3 text-lg">
            Your curated collection of saved favourites ✨
          </p>
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <div className="text-center mt-24 animate-fadeIn">
            <Heart size={90} className="mx-auto text-gray-300 animate-pulse" />
            <p className="text-2xl text-gray-500 mt-4">Your wishlist is empty</p>
          </div>
        ) : (
          /* GRID ITEMS */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 animate-fadeIn">
            {items.map((item) => (
              <div
                key={item.id}
                className="
                  bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                  hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]
                  transition-all p-6 relative overflow-hidden group border border-gray-100
                "
              >
               <button
  onClick={() => removeItem(item.productId)}
  className="
    absolute right-5 top-5 bg-white shadow-lg 
    p-2.5 rounded-full text-red-500 
    hover:bg-red-50 hover:scale-110 transition
    z-20
  "
>
  <Trash2 size={18} />
</button>


                {/* Image */}
<div className="overflow-hidden rounded-2xl relative z-10">
                  <img
                    src={getImage(item)}
                    alt={item.productName}
                    className="
                      w-full h-56 object-cover rounded-2xl
                      group-hover:scale-110 transition-transform duration-500
                    "
                  />
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.productName}
                  </h3>
                  <p className="text-pink-600 font-bold text-2xl mt-2">
                    ₹{item.price}
                  </p>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(item.productId)}
                  className="
                    w-full mt-6 py-3 rounded-xl text-white font-semibold 
                    flex items-center justify-center gap-2
                    bg-gradient-to-r from-indigo-600 to-purple-600 
                    hover:from-indigo-700 hover:to-purple-700 
                    transition-all shadow-lg hover:shadow-2xl
                  "
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Fade Animation CSS */}
        <style>
          {`
            .animate-fadeIn {
              animation: fadeIn 0.7s ease-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse-slow {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.85; }
            }
            .animate-pulse-slow {
              animation: pulse-slow 2.4s infinite ease-in-out;
            }
          `}
        </style>
      </div>
    </div>
  );
}
