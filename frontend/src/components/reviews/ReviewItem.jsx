// src/components/reviews/ReviewItem.jsx
import React from "react";
import { Star } from "lucide-react";

export default function ReviewItem({ review }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
      {/* USER + DATE */}
      <div className="flex justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900">{review.userName || "Anonymous"}</p>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={
                  s <= review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {new Date(review.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* COMMENT */}
      <p className="text-gray-700 leading-relaxed">{review.body}</p>
    </div>
  );
}
