import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { User, Mail, Phone, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    fullName: "",
    role: "CUSTOMER",
  });

  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({
    username: null,
    email: null,
    phone: null,
  });

  const [otp, setOtp] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const resendRef = useRef(null);

  const [generalError, setGeneralError] = useState("");

  const debounceRefs = useRef({ username: null, email: null, phone: null });

  // ------------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------------
  const validateField = (name, value) => {
    if (name === "username") {
      if (!value) return "Username required";
      if (value.length < 3) return "Minimum 3 characters";
      return "";
    }
    if (name === "email") {
      const re = /^[\w-.]+@[\w-]+\.[a-z]{2,}$/i;
      if (!value) return "Email required";
      if (!re.test(value)) return "Invalid email";
      return "";
    }
    if (name === "phone") {
      if (!value) return "";
      if (!/^\d{10}$/.test(value)) return "Phone must be 10 digits";
      return "";
    }
    if (name === "password") {
      if (!value) return "Password required";
      if (value.length < 6) return "Minimum 6 characters";
      return "";
    }
    return "";
  };

  const updateField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
    setGeneralError("");

    // Availability checks
    if (["username", "email", "phone"].includes(name)) {
      setAvailability((p) => ({ ...p, [name]: "checking" }));

      if (debounceRefs.current[name]) clearTimeout(debounceRefs.current[name]);

      debounceRefs.current[name] = setTimeout(() => {
        checkAvailability(name, value);
      }, 600);
    }
  };

  // ------------------------------------------------------------
  // AVAILABILITY CHECK API CALL
  // ------------------------------------------------------------
  const checkAvailability = async (field, value) => {
    if (!value) {
      setAvailability((p) => ({ ...p, [field]: null }));
      return null;
    }

    try {
      const map = {
        username: { url: "/auth/check-username", param: "username" },
        email: { url: "/auth/check-email", param: "email" },
        phone: { url: "/auth/check-phone", param: "phone" },
      };

      const { url, param } = map[field];
      const res = await api.get(url, { params: { [param]: value } });

      let available = false;

      if (typeof res.data === "boolean") available = res.data;
      else available = !!(res.data?.data ?? res.data);

      setAvailability((p) => ({ ...p, [field]: available }));
      return available;
    } catch {
      setAvailability((p) => ({ ...p, [field]: false }));
      return false;
    }
  };

  const ensureAvailability = async () => {
    const results = {};
    for (const field of ["username", "email", "phone"]) {
      const val = form[field];
      if (!val) continue;

      if (availability[field] === null || availability[field] === "checking") {
        results[field] = await checkAvailability(field, val);
      } else {
        results[field] = availability[field];
      }
    }
    return results;
  };

  // ------------------------------------------------------------
  // OTP GENERATE
  // ------------------------------------------------------------
  const requestOtp = async () => {
    const newErr = {};

    ["username", "email", "password"].forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) newErr[f] = err;
    });

    if (form.phone) {
      const err = validateField("phone", form.phone);
      if (err) newErr.phone = err;
    }

    setErrors(newErr);
    if (Object.keys(newErr).length > 0) return;

    setLoading(true);

    try {
      const av = await ensureAvailability();

      if (av.username === false) {
        setGeneralError("Username already exists");
        setLoading(false);
        return;
      }
      if (av.email === false) {
        setGeneralError("Email already registered");
        setLoading(false);
        return;
      }
      if (form.phone && av.phone === false) {
        setGeneralError("Phone number already registered");
        setLoading(false);
        return;
      }

      const ident = form.email.trim();
      await api.post("/otp/generate", { identifier: ident });

      setIdentifier(ident);
      setStep(2);
      startResendTimer();
    } catch (err) {
      setGeneralError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // OTP VERIFY + REGISTER
  // ------------------------------------------------------------
  const verifyOtpAndRegister = async () => {
    if (!otp) {
      setGeneralError("Please enter OTP");
      return;
    }

    setOtpLoading(true);

    try {
      await api.post("/otp/verify", { identifier, otp: otp.trim() });

      const av = await ensureAvailability();
      if (av.username === false || av.email === false || av.phone === false) {
        setGeneralError("Details changed, try again");
        setOtpLoading(false);
        setStep(1);
        return;
      }

      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        fullName: form.fullName || null,
        role: form.role,
      });

      alert("Registration successful");
      navigate("/login");
    } catch (err) {
      setGeneralError("Invalid OTP or registration failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // ------------------------------------------------------------
  // RESEND OTP TIMER
  // ------------------------------------------------------------
  const startResendTimer = (sec = 60) => {
    setResendTimer(sec);

    if (resendRef.current) clearInterval(resendRef.current);

    resendRef.current = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) {
          clearInterval(resendRef.current);
          resendRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    if (!identifier) return;
    setOtpLoading(true);
    try {
      await api.post("/otp/generate", { identifier });
      startResendTimer();
    } finally {
      setOtpLoading(false);
    }
  };

  // ------------------------------------------------------------
  // AVAILABILITY TEXT BELOW INPUTS
  // ------------------------------------------------------------
  const availText = (field) => {
    if (availability[field] === true)
      return <p className="text-xs text-green-600 mt-1">✓ {field} available</p>;

    if (availability[field] === false)
      return <p className="text-xs text-red-600 mt-1">✗ {field} already taken</p>;

    return null;
  };

  const availIcon = (v) => {
    if (v === "checking") return <span className="text-gray-400">…</span>;
    if (v === true) return <Check className="text-green-600" size={18} />;
    if (v === false) return <X className="text-red-600" size={18} />;
    return null;
  };

  // ------------------------------------------------------------
  // UI RENDERING
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        
        {/* STEP 1 FORM */}
        {step === 1 && (
          <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">

            <h2 className="text-2xl font-bold text-center">Create Account</h2>
            <p className="text-center text-gray-600">Welcome to our platform</p>

            {generalError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded">
                {generalError}
              </div>
            )}

            {/* USERNAME */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-12 pr-10 py-3 border rounded-lg"
                placeholder="Username"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{availIcon(availability.username)}</div>
              {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
              {!errors.username && availText("username")}
            </div>

            {/* EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-12 pr-10 py-3 border rounded-lg"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{availIcon(availability.email)}</div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              {!errors.email && availText("email")}
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-12 pr-10 py-3 border rounded-lg"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{availIcon(availability.phone)}</div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              {!errors.phone && form.phone && availText("phone")}
            </div>

            {/* Full name */}
            <input
              className="w-full px-4 py-3 border rounded-lg"
              placeholder="Full name (optional)"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-12 pr-10 py-3 border rounded-lg"
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* ROLE */}
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 border rounded-lg cursor-pointer ${form.role === "CUSTOMER" ? "bg-pink-50 border-pink-400" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="CUSTOMER"
                  checked={form.role === "CUSTOMER"}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="mr-2"
                />
                Customer
              </label>

              <label className={`p-3 border rounded-lg cursor-pointer ${form.role === "SHOPKEEPER" ? "bg-pink-50 border-pink-400" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="SHOPKEEPER"
                  checked={form.role === "SHOPKEEPER"}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="mr-2"
                />
                Shopkeeper
              </label>
            </div>

            <button
              onClick={requestOtp}
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <p className="text-center">
              Already have an account?{" "}
              <span
                className="text-primary font-semibold cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </div>
        )}

        {/* STEP 2 OTP SCREEN */}
        {step === 2 && (
          <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-center">Verify OTP</h2>
            <p className="text-center text-gray-600">
              Enter the 4-digit OTP sent to <span className="font-semibold">{identifier}</span>
            </p>

            {generalError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded">
                {generalError}
              </div>
            )}

            <input
              className="w-full py-3 px-4 border rounded-lg text-center text-xl tracking-widest"
              placeholder="----"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />

            <button
              onClick={verifyOtpAndRegister}
              disabled={otpLoading}
              className="w-full py-3 bg-primary text-white rounded-lg"
            >
              {otpLoading ? "Verifying..." : "Verify & Register"}
            </button>

            <div className="flex justify-between items-center">
              <button
                className="text-gray-600 underline"
                onClick={() => setStep(1)}
              >
                Edit details
              </button>

              <button
                className="text-sm px-3 py-2 border rounded-lg disabled:opacity-50"
                disabled={resendTimer > 0}
                onClick={resendOtp}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
