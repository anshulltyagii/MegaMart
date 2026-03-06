import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI, cartAPI } from "../services/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cart Count Global
  const [cartCount, setCartCount] = useState(0);

  // ---------------------------------------------------
  // ██████  Load Cart Count
  // ---------------------------------------------------
  const refreshCartCount = async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const res = await cartAPI.get();

      const cartData = res.data?.data || res.data;
      const items = cartData?.items || [];

      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQty);
    } catch (err) {
      console.error("Failed cart count:", err);
      setCartCount(0);
    }
  };

  // ---------------------------------------------------
  // ██████  Restore Login from Token
  // ---------------------------------------------------
  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        const userId = decoded.userId || decoded.sub;
        const userRole =
          decoded.role || decoded.authorities?.[0] || "CUSTOMER";

        setUser({
          id: userId,
          username: decoded.username,
        });

        setRole(userRole);

        localStorage.setItem("userId", userId);
        localStorage.setItem("role", userRole);

        // Load cart count ONLY for customers
        if (userRole === "CUSTOMER") {
          refreshCartCount();
        }
      } catch (err) {
        console.error("Token decode error:", err);
        localStorage.clear();
        sessionStorage.clear();
      }
    }

    // Finish loading state AFTER token check
    setLoading(false);
  }, []);

  // ---------------------------------------------------
  // ██████  LOGIN FUNCTION
  // ---------------------------------------------------
  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      const token = res.data.data;

      const decoded = jwtDecode(token);
      const userRole = decoded.role || "CUSTOMER";
      const userId = decoded.userId || decoded.sub;

      // Store token
      if (credentials.rememberMe) localStorage.setItem("token", token);
      else sessionStorage.setItem("token", token);

      localStorage.setItem("userId", userId);
      localStorage.setItem("role", userRole);

      setUser({ id: userId, username: decoded.username });
      setRole(userRole);

      // Refresh cart count
      if (userRole === "CUSTOMER") {
        await refreshCartCount();
      }

      return { success: true, role: userRole };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // ---------------------------------------------------
  // ██████  LOGOUT FUNCTION
  // ---------------------------------------------------
  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setRole(null);
    setCartCount(0);

    window.location.href = "/";
  };

  // ---------------------------------------------------
  // ██████  REGISTER
  // ---------------------------------------------------
  const register = async (data) => {
    try {
      await authAPI.register(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed",
      };
    }
  };

  // ---------------------------------------------------
  // ██████  PROVIDER VALUE
  // ---------------------------------------------------
  const value = {
    user,
    role,
    loading,

    login,
    register,
    logout,

    isAuthenticated: !!user,
    isCustomer: role === "CUSTOMER",
    isShopkeeper: role === "SHOPKEEPER",
    isAdmin: role === "ADMIN",

    cartCount,
    refreshCartCount,
  };

  // ---------------------------------------------------
  // ██████  FIXED LOADING HANDLER (IMPORTANT)
  // ---------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
