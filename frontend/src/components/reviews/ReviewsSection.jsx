// src/components/reviews/ReviewsSection.jsx
import React, { useState, useEffect } from "react";
import { reviewAPI } from "../../services/api";
import ReviewItem from "./ReviewItem";
import ReviewForm from "./ReviewForm";
import { Star } from "lucide-react";

export default function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [filter, setFilter] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews(filter);
    loadAvgRating();
  }, [filter]);

  const loadAvgRating = async () => {
    try {
      const res = await reviewAPI.getAvgRating(productId);
      setAvgRating(res.data || 0);
    } catch (err) {
      console.error("Avg rating error:", err);
    }
  };

  const loadReviews = async (type) => {
    setLoading(true);
    try {
      const res = await reviewAPI.getByProduct(productId, type);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Review fetch failed:", err);
      setReviews([]);
    }
    setLoading(false);
  };

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>

        {/* FILTER BUTTONS */}
        <div className="flex gap-2">
          {["newest", "highest", "lowest"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {f === "newest" && "Newest"}
              {f === "highest" && "Top Rated"}
              {f === "lowest" && "Low Rated"}
            </button>
          ))}
        </div>
      </div>

      {/* AVERAGE RATING CARD */}
      <div className="bg-white rounded-2xl shadow-soft p-6 flex items-center gap-4 mb-10 border border-gray-100">
        <Star className="text-yellow-400 fill-yellow-400" size={40} />
        <div>
          <p className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          <p className="text-gray-600 text-sm">Average Rating</p>
        </div>
      </div>

      {/* ADD REVIEW FORM */}
      {/* Only logged-in users can write a review */}
{(localStorage.getItem("token") || sessionStorage.getItem("token")) ? (
  <ReviewForm productId={productId} refresh={() => loadReviews(filter)} />
) : (
  <div className="bg-white rounded-2xl p-6 shadow-soft mb-10 border border-gray-100 text-center text-gray-600">
    <p>You must be logged in to write a review.</p>
    <button
      onClick={() => window.location.href = "/login"}
      className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700"
    >
      Login to Review
    </button>
  </div>
)}

      {/* REVIEWS LIST */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white text-center p-12 rounded-3xl shadow-soft text-gray-500">
          No reviews yet. Be the first!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
