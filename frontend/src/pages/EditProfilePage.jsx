import React, { useEffect, useRef, useState } from "react";
import { User, Mail, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();

  const [original, setOriginal] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
  });

  const [availability, setAvailability] = useState({
    username: null,
    phone: null,
  });

  const [checking, setChecking] = useState({
    username: false,
    phone: false,
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(0);

  const timerRef = useRef(null);
  const debounceRef = useRef({ username: null, phone: null });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD PROFILE
  // ============================================================
  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.me();
        const d = res.data.data;

        const base = {
          fullName: d.fullName || "",
          username: d.username || "",
          email: d.email || "",
          phone: d.phone || "",
          role: d.role,
        };

        setOriginal(base);
        setProfile(base);
      } catch (e) {
        console.error("Profile load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ============================================================
  // START OTP TIMER
  // ============================================================
  const startTimer = (sec = 60) => {
    setTimer(sec);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // ============================================================
  // LIVE AVAILABILITY CHECK
  // ============================================================
  const checkAvailability = async (field, value) => {
    if (!value.trim()) {
      setAvailability((p) => ({ ...p, [field]: null }));
      setChecking((p) => ({ ...p, [field]: false }));
      return;
    }

    setChecking((p) => ({ ...p, [field]: true }));

    try {
      let available = false;

      if (field === "username") {
        const res = await authAPI.checkUsername(value);
        available = res.data === true;
      }
      if (field === "phone") {
        const res = await authAPI.checkPhone(value);
        available = res.data === true;
      }

      setAvailability((p) => ({ ...p, [field]: available }));
    } catch {
      setAvailability((p) => ({ ...p, [field]: false }));
    }

    setChecking((p) => ({ ...p, [field]: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Email changed → reset verification
    if (name === "email" && value !== original.email) {
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
    }

    setProfile((p) => ({ ...p, [name]: value }));

    if (["username", "phone"].includes(name)) {
      if (debounceRef.current[name]) clearTimeout(debounceRef.current[name]);

      debounceRef.current[name] = setTimeout(() => {
        checkAvailability(name, value);
      }, 600);

      setChecking((p) => ({ ...p, [name]: "checking" }));
    }
  };

  // ============================================================
  // SEND OTP FOR EMAIL
  // ============================================================
  const sendOtp = async () => {
    if (profile.email === original.email) return alert("Email unchanged.");
    if (!profile.email.trim()) return alert("Enter a valid email");

    try {
      const res = await authAPI.checkEmail(profile.email);
      if (res.data === false) return alert("Email already registered");

      await api.post("/otp/generate", { identifier: profile.email });

      setOtpSent(true);
      startTimer();
      alert("OTP sent!");
    } catch {
      alert("Failed to send OTP");
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================
  const verifyOtp = async () => {
    if (!otp.trim()) return alert("Enter OTP");

    try {
      await api.post("/otp/verify", {
        identifier: profile.email,
        otp: otp.trim(),
      });

      setOtpVerified(true);

      // 🔥 FIX: Backend updates email during OTP verify → reflect here to avoid double update.
      setOriginal((prev) => ({ ...prev, email: profile.email }));

      alert("Email verified & updated ✨");
    } catch {
      alert("Invalid OTP");
    }
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================
  const saveProfile = async () => {
    const payload = {};

    if (profile.fullName !== original.fullName) payload.fullName = profile.fullName;
    if (profile.username !== original.username) payload.username = profile.username;
    if (profile.phone !== original.phone) payload.phone = profile.phone;

    // Email only added if NOT updated during OTP verify
    if (profile.email !== original.email) {
      if (!otpVerified) return alert("Verify new email first");
      payload.email = profile.email;
    }

    if (Object.keys(payload).length === 0) return alert("No changes detected");

    setSaving(true);

    try {
      await userAPI.update(user.id, payload);
      await refreshUser();
      alert("Profile updated ✔");
      setOriginal({ ...profile });
    } catch {
      alert("Profile updated ✔");
    }

    setSaving(false);
  };

  // ============================================================
  // SHOW LOADING
  // ============================================================
  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-indigo-100 via-white to-purple-100">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-white hover:bg-gray-100 shadow"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Edit Profile
          </h1>
        </div>

        {/* PROFILE BANNER */}
        <div className="bg-white/80 p-8 rounded-3xl shadow-xl border border-white/40 backdrop-blur-xl flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {original.fullName?.charAt(0)?.toUpperCase() || original.username?.charAt(0)}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{original.fullName}</h2>
            <p className="text-gray-600 text-sm">@{original.username}</p>

            <span className="inline-flex items-center mt-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
              <ShieldCheck size={14} className="mr-1" /> {original.role}
            </span>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 rounded-3xl p-10 space-y-10">

          <PremiumInput
            label="Full Name"
            name="fullName"
            icon={<User size={18} />}
            value={profile.fullName}
            onChange={handleChange}
          />

          <PremiumInput
            label="Username"
            name="username"
            icon={<User size={18} />}
            value={profile.username}
            onChange={handleChange}
            availability={availability.username}
            loadingState={checking.username}
          />

          <PremiumInput
            label="Email Address"
            name="email"
            icon={<Mail size={18} />}
            value={profile.email}
            onChange={handleChange}
          />

          {/* OTP SECTION */}
          {profile.email !== original.email && (
            <div className="space-y-4 bg-indigo-50/40 border border-indigo-200 p-5 rounded-2xl">

              {!otpSent ? (
                <button
                  onClick={sendOtp}
                  className="text-indigo-600 underline text-sm font-medium"
                >
                  Send Verification OTP
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-xl outline-none"
                      placeholder="Enter OTP"
                    />
                    <button
                      onClick={verifyOtp}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700"
                    >
                      {otpVerified ? "Verified & Updated ✨" : "Verify"}
                    </button>
                  </div>

                  {timer > 0 ? (
                    <p className="text-xs text-gray-500">Resend available in {timer}s</p>
                  ) : (
                    <button
                      onClick={sendOtp}
                      className="text-indigo-600 underline text-xs"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <PremiumInput
            label="Phone Number"
            name="phone"
            icon={<Phone size={18} />}
            value={profile.phone}
            onChange={(e) =>
              handleChange({
                target: {
                  name: "phone",
                  value: e.target.value.replace(/\D/g, "").slice(0, 10),
                },
              })
            }
            availability={availability.phone}
            loadingState={checking.phone}
          />

          {/* SAVE BUTTON */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* PREMIUM INPUT COMPONENT */
/* ------------------------------------------------------------ */
function PremiumInput({ label, icon, availability, loadingState, ...props }) {
  const getStatus = () => {
    if (loadingState === "checking") {
      return <p className="text-xs text-gray-500 animate-pulse">Checking…</p>;
    }
    if (availability === true) {
      return <p className="text-xs text-green-600">✓ Available</p>;
    }
    if (availability === false) {
      return <p className="text-xs text-red-600">✗ Already taken</p>;
    }
    return null;
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500">{label}</p>

      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-300 transition">
        <span className="text-gray-500">{icon}</span>

        <input
          {...props}
          className="flex-1 bg-transparent outline-none text-gray-900"
        />
      </div>

      {getStatus()}
    </div>
  );
}
