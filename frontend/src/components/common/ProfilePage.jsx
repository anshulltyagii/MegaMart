import React, { useEffect, useState } from "react";
import api from "../../services/api";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me");

      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Profile Error:", err);
      setProfile(null);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!profile)
    return (
      <div className="p-6 text-red-600 text-center text-lg font-semibold">
        Failed to load profile ❌
      </div>
    );

  const safeProfile = {
    fullName: profile.fullName,
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    createdAt: profile.createdAt,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fadeSlide">

      {/* ==================== TITLE ==================== */}
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight mb-10">
        My Profile
      </h1>

      {/* ==================== WRAPPER CARD ==================== */}
      <div
        className="
          bg-white/70 backdrop-blur-3xl p-10 rounded-3xl shadow-2xl 
          border border-white/40 relative overflow-hidden
        "
      >
        {/* Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-300/10 via-purple-300/10 to-transparent pointer-events-none" />

        {/* ==================== HEADER PROFILE ==================== */}
        <div className="flex items-center gap-10 relative z-10">
          <div
            className="
              h-28 w-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 
              shadow-xl flex items-center justify-center 
              text-white text-5xl font-extrabold
            "
          >
            {safeProfile.fullName?.charAt(0) || safeProfile.username?.charAt(0)}
          </div>

          <div>
            <h2 className="text-4xl font-bold text-gray-900">
              {safeProfile.fullName}
            </h2>
            <p className="text-gray-500 text-lg">@{safeProfile.username}</p>

            <span
              className="
                inline-flex items-center gap-2 mt-4 px-4 py-1.5 
                bg-indigo-100 text-indigo-700 rounded-full 
                text-sm font-semibold shadow 
              "
            >
              <ShieldCheck size={16} />
              {safeProfile.role}
            </span>
          </div>
        </div>

        {/* ==================== DETAILS GRID ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">

          <PremiumField
            label="Full Name"
            icon={<User size={20} />}
            value={safeProfile.fullName}
          />

          <PremiumField
            label="Email Address"
            icon={<Mail size={20} />}
            value={safeProfile.email}
          />

          <PremiumField
            label="Phone Number"
            icon={<Phone size={20} />}
            value={safeProfile.phone || "Not provided"}
          />

          <PremiumField
            label="Account Role"
            icon={<ShieldCheck size={20} />}
            value={safeProfile.role}
          />

          <PremiumField
            label="Member Since"
            icon={<Calendar size={20} />}
            value={new Date(safeProfile.createdAt).toLocaleDateString()}
          />

        </div>

        {/* ==================== EDIT BUTTON ==================== */}
        <div className="mt-12 text-right relative z-10">
          <button
            className="
              px-8 py-3 rounded-xl 
              bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
              font-semibold shadow-xl hover:shadow-2xl
              transition-transform duration-300 hover:scale-105 active:scale-95
            "
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function PremiumField({ label, value, icon }) {
  return (
    <div
      className="
        flex items-start gap-4 
        bg-white/60 border border-gray-200 rounded-2xl 
        p-6 shadow-sm hover:shadow-lg transition-all backdrop-blur-xl
      "
    >
      <div className="text-indigo-600">{icon}</div>
      <div>
        <p className="text-xs uppercase text-gray-500 tracking-widest font-semibold">
          {label}
        </p>
        <p className="text-gray-900 mt-1 text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
