import React, { useState } from "react";
import api from "../../services/api";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      await api.post("/otp/generate", { identifier: email });
      navigate("/verify-otp-reset", { state: { email } });
    } catch (err) {
      setError("Failed to send OTP");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">

        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <p className="text-center text-gray-600">
          Enter your registered email to receive OTP
        </p>

        {error && <p className="p-3 bg-red-100 text-red-600 rounded">{error}</p>}

        <form onSubmit={handleSendOtp} className="space-y-4">

          <div className="relative">
            <Mail className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-3 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-primary text-white py-3 rounded-lg"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
