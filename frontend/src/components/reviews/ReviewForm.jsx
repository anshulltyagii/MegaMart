// src/components/reviews/ReviewForm.jsx
import React, { useState } from "react";
import { reviewAPI } from "../../services/api";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ReviewForm({ productId, refresh }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    // ✅ FIX: get userId from storage (NOT token decoding)
    const userId =
      localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (!userId) {
      navigate("/login");
      return;
    }

    if (rating === 0 || comment.trim() === "") {
      alert("Please enter a rating and a comment.");
      return;
    }

    setLoading(true);
    try {
      await reviewAPI.add(userId, {
        productId,
        rating,
        body: comment,
      });

      setRating(0);
      setComment("");
      refresh();
    } catch (err) {
      console.error("Failed to add review:", err);
      alert(err.response?.data || "Failed to submit review");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft mb-10 border border-gray-100">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Write a Review</h3>

      {/* STAR SELECTOR */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={28}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            className={`cursor-pointer transition-all ${
              (hover || rating) >= s
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>

      <textarea
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
        rows="4"
      />

      <button
        onClick={submitReview}
        disabled={loading}
        className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
