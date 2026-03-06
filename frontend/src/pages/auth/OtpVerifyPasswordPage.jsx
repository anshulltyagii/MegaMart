import React, { useState } from "react";
import api from "../../services/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function OtpVerifyPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) navigate("/forgot-password");

  const handleVerify = async () => {
    setError("");

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    setLoading(true);

    try {
      await api.post("/otp/verify", { identifier: email, otp });
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError("Invalid or expired OTP");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full space-y-6">

        <h2 className="text-2xl font-bold text-center">Verify OTP</h2>

        <p className="text-center text-gray-600">
          OTP sent to <span className="font-semibold">{email}</span>
        </p>

        {error && <p className="p-3 bg-red-100 text-red-600 rounded">{error}</p>}

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-3 border rounded-lg text-center tracking-widest text-xl"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
        />

        <button
          onClick={handleVerify}
          className="w-full bg-primary text-white py-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </div>
  );
}
