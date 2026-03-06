import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Auth Context login()

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  // -------------------------------------------------------
  // 🔥 6-second TOAST (auto fade + auto destroy)
  // -------------------------------------------------------
  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
    fade: false,
  });

  const showToast = (type, message) => {
    setToast({ show: true, type, message, fade: false });

    setTimeout(() => {
      setToast((t) => ({ ...t, fade: true }));
    }, 5500);

    setTimeout(() => {
      setToast({ show: false, type: "", message: "", fade: false });
    }, 6000);
  };

  // Email validation
  const isEmail = form.identifier.includes("@");
  const emailValid =
    !isEmail || /^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(form.identifier);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // -------------------------------------------------------
  // 🔥 LOGIN HANDLER
  // -------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.identifier.trim()) {
      showToast("error", "Enter your email or username");
      return;
    }

    if (isEmail && !emailValid) {
      showToast("error", "Enter a valid email format");
      return;
    }

    if (!form.password.trim()) {
      showToast("error", "Enter your password");
      return;
    }

    setLoading(true);

    try {
      // Backend login request
      const res = await api.post("/auth/login", {
        identifier: form.identifier,
        password: form.password,
      });

      const token = res.data?.data;
      if (!token) {
        showToast("error", "Invalid server response");
        setLoading(false);
        return;
      }

      // Save token based on Remember Me
      if (remember) localStorage.setItem("token", token);
      else sessionStorage.setItem("token", token);

      // Also update AuthContext
      const contextResult = await login({
        identifier: form.identifier,
        password: form.password,
      });

      if (!contextResult.success) {
        showToast("error", contextResult.message);
        setLoading(false);
        return;
      }

      // Decode role
      let role = "CUSTOMER";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        role = payload.role || payload.authorities?.[0] || "CUSTOMER";
      } catch {}

      showToast("success", "Login Successful 🎉");

try {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const role = payload.role;

  if (role === "SHOPKEEPER") {
    const shopRes = await api.get("/shops/my");

    const shops = shopRes.data?.data || [];

    if (shops.length > 0) {
      localStorage.setItem("shopId", shops[0].id);
    }
  }
} catch (e) {
  console.warn("Failed to get shop ID");
}


setTimeout(() => {
  if (role === "ADMIN") navigate("/admin/dashboard");
  else if (role === "SHOPKEEPER") navigate("/vendor/home");
  else navigate("/");
}, 900);


    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Invalid email/username or password";

      showToast("error", msg);
    }
    

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      {/* 🔥 Toast UI */}
      {toast.show && (
        <div
          className={`
            fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white
            transition-all duration-500
            ${toast.fade ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-pink-400 rounded-full flex items-center justify-center mb-3">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-1">Login using your email or username</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Identifier */}
          <div className="relative">
            {isEmail ? (
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            ) : (
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            )}

            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="Email or Username"
              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 ${
                !emailValid ? "focus:ring-red-300 border-red-400" : "focus:ring-primary"
              }`}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary"
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Remember + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-primary text-sm font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register */}
        <p className="text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
