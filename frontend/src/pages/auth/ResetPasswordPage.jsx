import React, { useState } from "react";
import api from "../../services/api";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;

  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) navigate("/forgot-password");

  const handleReset = async () => {
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        newPassword: password,
      });

      alert("Password reset successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError("Failed to reset password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">

        <h2 className="text-2xl font-bold text-center">Create New Password</h2>

        {error && <p className="p-3 bg-red-100 text-red-600 rounded">{error}</p>}

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? "text" : "password"}
            className="w-full pl-12 pr-12 py-3 border rounded-lg"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          onClick={handleReset}
          className="w-full bg-primary text-white py-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}
