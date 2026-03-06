import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  Heart,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { productAPI } from "../../services/api";

const Header = () => {
  const { role, isAuthenticated, logout, cartCount } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const suggestRef = useRef();
  const profileRef = useRef();

  const highlightMatch = (text) => {
    if (!search.trim()) return text;
    const regex = new RegExp(search, "gi");
    return text.replace(
      regex,
      (match) =>
        `<mark class="bg-yellow-300/70 px-1 rounded-md text-black">${match}</mark>`
    );
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await productAPI.search(search);
        const list = res.data || [];
        setSuggestions(list.slice(0, 5));
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(delay);
  }, [search]);

  const handleEnter = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/products?search=${search}`);
      setShowSuggest(false);
    }
  };

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (suggestRef.current && !suggestRef.current.contains(e.target))
        setShowSuggest(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const goToHomeByRole = () => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (role === "CUSTOMER") {
      navigate("/");
    } else if (role === "SHOPKEEPER") {
      navigate("/vendor/home");
    } else if (role === "ADMIN") {
      navigate("/admin/dashboard");
    }
  };

  const renderProfileMenu = () => (
    <div
      className="
        absolute right-0 mt-4 w-72 backdrop-blur-2xl bg-white/80
        border border-white/20 shadow-2xl rounded-2xl z-50
        animate-dropdown p-3
      "
    >
      <div className="px-4 py-1 text-gray-500 text-xs uppercase tracking-wide font-semibold">
        Account
      </div>

      <Link className="menu-item" to="/profile">My Profile</Link>

      {role === "CUSTOMER" && (
        <>
          <Link className="menu-item" to="/orders">Orders</Link>
          <Link className="menu-item" to="/addresses">Addresses</Link>
        </>
      )}

      {role === "SHOPKEEPER" && (
        <>
          <Link className="menu-item" to="/vendor/home">Dashboard</Link>
          <Link className="menu-item" to="/vendor/shops">My Shops</Link>
          <Link className="menu-item" to="/vendor/coupons">Coupons</Link>
        </>
      )}

      {role === "ADMIN" && (
        <>
          <Link className="menu-item" to="/admin/users">Users</Link>
          <Link className="menu-item" to="/admin/logs">Admin Logs</Link>
        </>
      )}

      <button
        onClick={logout}
        className="
          w-full text-left px-4 py-2 mt-1 rounded-xl 
          text-red-600 font-semibold hover:bg-red-100/60 
          transition shadow-sm
        "
      >
        Logout
      </button>
    </div>
  );

  return (
    <header
      className={`
        sticky top-0 z-50 w-full transition-all duration-300 
        backdrop-blur-xl 
        ${
          scrolled
            ? "bg-white/70 shadow-lg border-b border-gray-200"
            : "bg-white/30 py-2"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <div
            onClick={goToHomeByRole}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div
              className="
                w-12 h-12 rounded-2xl bg-gradient-to-br 
                from-indigo-500 to-purple-600 text-white flex
                items-center justify-center text-xl font-extrabold 
                shadow-lg transition-transform group-hover:scale-110
              "
            >
              M
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              Mega<span className="text-indigo-600">Mart</span>
            </span>
          </div>

          {/* SEARCH BAR */}
          <div ref={suggestRef} className="relative hidden md:block w-full max-w-xl mx-10">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggest(true);
              }}
              onKeyDown={handleEnter}
              placeholder="Search premium products..."
              className="
                w-full py-3 px-12 rounded-2xl bg-gray-100/60 border 
                border-gray-200 shadow-sm text-gray-700 font-medium
                focus:bg-white focus:ring-4 focus:ring-indigo-500/20 
                transition-all outline-none
              "
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            {showSuggest && suggestions.length > 0 && (
              <div
                className="
                  absolute w-full mt-2 p-2 bg-white/90 backdrop-blur-xl 
                  border border-gray-200 shadow-2xl rounded-2xl z-50
                  animate-dropdown
                "
              >
                {suggestions.map((item) => (
                  <div
                    key={item.id}
onMouseDown={() => navigate(`/product/${item.id}`)}
                    className="
                      px-4 py-3 rounded-xl cursor-pointer
                      hover:bg-gray-100 transition flex items-center justify-between
                    "
                  >
                    <span
                      className="font-semibold text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(item.name),
                      }}
                    />
                    <span className="text-green-600 font-bold">
                      ₹{item.sellingPrice}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-6">

            {/* PREMIUM PRODUCTS BUTTON FOR CUSTOMER */}
            {isAuthenticated && role === "CUSTOMER" && (
              <Link
                to="/products"
                className="
                  hidden md:block
                  px-4 py-2 rounded-xl
                  bg-white/50 backdrop-blur-md
                  border border-gray-200 
                  text-gray-800 font-semibold 
                  shadow-sm hover:shadow-md
                  hover:bg-white/70 
                  transition-all
                "
              >
                Products
              </Link>
            )}

            {!isAuthenticated && (
              <>
                <Link className="premium-link" to="/login">Log In</Link>
                <Link className="btn-primary" to="/register">Sign Up</Link>
              </>
            )}

            {isAuthenticated && role === "CUSTOMER" && (
              <>
                <Link className="icon-btn" to="/wishlist">
                  <Heart size={22} />
                </Link>

                <Link className="relative icon-btn" to="/cart">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span
                      className="
                        absolute -top-2 -right-2 bg-red-600 text-white text-[10px]
                        font-bold rounded-full w-5 h-5 flex items-center justify-center
                        border-2 border-white
                      "
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {isAuthenticated && (
              <div ref={profileRef} className="relative">
                <button
                  className="icon-btn p-2 bg-gray-100 hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(!profileOpen);
                  }}
                >
                  <User size={22} className="text-gray-700" />
                </button>
                {profileOpen && renderProfileMenu()}
              </div>
            )}

            <button className="md:hidden icon-btn">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style>
        {`
          .menu-item {
            display: block;
            padding: 10px 16px;
            border-radius: 12px;
            font-weight: 500;
            color: #333;
            transition: 0.25s;
          }
          .menu-item:hover {
            background: rgba(0,0,0,0.06);
          }

          .icon-btn {
            transition: 0.3s;
            border-radius: 50%;
            padding: 6px;
            color: #555;
          }
          .icon-btn:hover {
            background: rgba(0,0,0,0.07);
            color: #4f46e5;
          }

          .premium-link {
            font-weight: 600;
            color: #333;
            transition: 0.25s;
          }
          .premium-link:hover {
            color: #4f46e5;
          }

          .btn-primary {
            background: linear-gradient(90deg, #4f46e5, #6366f1);
            color: white;
            padding: 8px 20px;
            font-weight: bold;
            border-radius: 50px;
            box-shadow: 0 4px 14px rgba(99,102,241,0.3);
            transition: 0.3s;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(99,102,241,0.4);
          }

          @keyframes dropdown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </header>
  );
};

export default Header;
