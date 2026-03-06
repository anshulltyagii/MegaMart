

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trash2,
  Plus,
  Minus,
  Tag,
  ShoppingBag,
  ArrowRight,
  Truck,
  X,
  Store,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { cartAPI, couponAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:9192";
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const CartPage = () => {
  const navigate = useNavigate();
  const { refreshCartCount } = useAuth();

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  const [showClearCartModal, setShowClearCartModal] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchActiveCoupons();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await cartAPI.get();
      const cartData = response.data?.data || response.data;

      setCart({
        items: cartData?.items || [],
        total: cartData?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${BASE_URL}/api/coupons/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setAvailableCoupons(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const itemsByShop = cart.items.reduce((acc, item) => {
    const shopId = item.shopId || "unknown";
    if (!acc[shopId]) {
      acc[shopId] = {
        shopName: item.shopName || "Shop",
        items: [],
      };
    }
    acc[shopId].items.push(item);
    return acc;
  }, {});

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 10) return;

    setUpdatingItem(itemId);
    try {
      await cartAPI.updateItem(itemId, newQuantity);

      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ),
      }));

      await refreshCartCount();

      if (couponApplied) {
        await validateCouponSilently(couponCode);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      fetchCart();
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    setRemovingItem(itemId);
    try {
      await cartAPI.removeItem(itemId);

      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));

      await refreshCartCount();

      if (couponApplied && cart.items.length <= 1) {
        removeCoupon();
      } else if (couponApplied) {
        await validateCouponSilently(couponCode);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setRemovingItem(null);
    }
  };

  const handleSelectCoupon = (code) => {
    setCouponCode(code);
    setCouponError("");
  };

  const validateCouponSilently = async (code) => {
    try {
      const response = await couponAPI.validate(code, subtotal);
      const resp = response.data?.data || response.data;
      if (resp) {
        const discount =
          resp.discountType === "PERCENT"
            ? Math.min(
                (subtotal * resp.discountValue) / 100,
                resp.maxDiscount || Infinity
              )
            : resp.discountValue;

        setCouponDiscount(discount);
        setCouponData(resp);
        setCouponApplied(true);
      }
    } catch {
      removeCoupon();
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError("");
    setApplyingCoupon(true);

    try {
      const response = await couponAPI.validate(couponCode, subtotal);
      const coupon = response.data?.data || response.data;

      if (coupon) {
        let discount = 0;
        if (coupon.discountType === "PERCENT") {
          discount = (subtotal * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }

        setCouponDiscount(discount);
        setCouponData(coupon);
        setCouponApplied(true);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError(
        error.response?.data?.message || "Invalid or expired coupon"
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponData(null);
    setCouponError("");
  };

  const confirmClearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [], total: 0 });
      removeCoupon();
      await refreshCartCount();
      setShowClearCartModal(false);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.currentPrice || item.priceAtAdd;
    return sum + price * item.quantity;
  }, 0);

  const totalMRP = cart.items.reduce((sum, item) => {
    return sum + (item.mrp || item.priceAtAdd) * item.quantity;
  }, 0);

  const productDiscount = totalMRP - subtotal;
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const total = subtotal - couponDiscount + deliveryFee;
  const totalSavings =
    productDiscount + couponDiscount + (subtotal >= 500 ? 40 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-indigo-50/60" />
          </div>
          <p className="text-gray-600 font-medium">
            Loading your cart, please wait...
          </p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white/80 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl p-10">
          <div className="w-28 h-28 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={52} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Looks like you haven&apos;t added anything to your cart yet. Explore
            our premium collection and add your favourites.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm md:text-base shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
          >
            Start Shopping
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20 relative">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shopping Cart
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              You have{" "}
              <span className="font-semibold text-gray-800">
                {cart.items.length}
              </span>{" "}
              item{cart.items.length > 1 && "s"} in your cart
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
              <ShieldCheck size={14} className="mr-1" />
              Secure Checkout
            </div>
            <button
              onClick={() => setShowClearCartModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm rounded-lg text-red-600 hover:bg-red-50 border border-red-100 font-medium transition-colors"
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {subtotal < 500 && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 md:p-5 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                    <Truck size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      Add{" "}
                      <span className="text-indigo-600">
                        ₹{(500 - subtotal).toLocaleString()}
                      </span>{" "}
                      more for{" "}
                      <span className="font-bold text-green-600">
                        FREE delivery
                      </span>
                      .
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Free delivery on orders above ₹500.
                    </p>
                  </div>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((subtotal / 500) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {Object.entries(itemsByShop).map(([shopId, shopData]) => (
              <div
                key={shopId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Store size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {shopData.shopName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {shopData.items.length} item
                      {shopData.items.length > 1 && "s"} from this shop
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {shopData.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 md:p-6 flex gap-4 md:gap-6 transition-all ${
                        removingItem === item.id
                          ? "opacity-50 scale-[0.99]"
                          : ""
                      }`}
                    >
                      <div
                        onClick={() => navigate(`/product/${item.productId}`)}
                        className="w-24 h-24 md:w-28 md:h-28 bg-gray-50 rounded-xl flex-shrink-0 cursor-pointer overflow-hidden border border-gray-100 flex items-center justify-center group"
                      >
                        {getImageUrl(item.imagePath) ? (
                          <img
                            src={getImageUrl(item.imagePath)}
                            alt={item.productName}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <ImageIcon
                            className="text-gray-300 group-hover:text-gray-400 transition-colors"
                            size={28}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <h3
                              className="text-base md:text-lg font-semibold text-gray-900 truncate hover:text-indigo-600 cursor-pointer"
                              onClick={() =>
                                navigate(`/product/${item.productId}`)
                              }
                            >
                              {item.productName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.currentPrice &&
                                item.mrp &&
                                item.mrp > item.currentPrice && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
                                    Offer Applied
                                  </span>
                                )}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={removingItem === item.id}
                            className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xl font-bold text-gray-900">
                            ₹
                            {(
                              item.currentPrice || item.priceAtAdd
                            ).toLocaleString()}
                          </span>
                          {item.mrp &&
                            item.mrp > (item.currentPrice || item.priceAtAdd) && (
                              <>
                                <span className="text-sm line-through text-gray-400">
                                  ₹{item.mrp.toLocaleString()}
                                </span>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  Save ₹
                                  {(
                                    item.mrp -
                                    (item.currentPrice || item.priceAtAdd)
                                  ).toLocaleString()}
                                </span>
                              </>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
                          <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1 w-fit">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={
                                item.quantity <= 1 || updatingItem === item.id
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-10 text-center font-semibold text-sm">
                              {updatingItem === item.id ? "..." : item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >= 10 || updatingItem === item.id
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">Item total</p>
                            <p className="text-lg font-bold text-gray-900">
                              ₹
                              {(
                                (item.currentPrice || item.priceAtAdd) *
                                item.quantity
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-24 overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  Order Summary
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Review your order and apply coupons before checkout.
                </p>
              </div>

              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-indigo-600" />
                  <span className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                    Apply Coupon
                  </span>
                </div>

                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-700">
                          {couponCode.toUpperCase()} applied
                        </p>
                        <p className="text-xs text-green-600">
                          You saved ₹{couponDiscount.toLocaleString()} with this
                          coupon.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="p-1.5 rounded-full hover:bg-green-100 text-green-700 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="ENTER CODE"
                        className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 uppercase tracking-wide"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || applyingCoupon}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {applyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="flex items-center gap-1 text-xs text-red-600 mt-2">
                        <AlertCircle size={14} /> {couponError}
                      </p>
                    )}

                    <div className="mt-4">
                      {loadingCoupons ? (
                        <p className="text-xs text-gray-400">
                          Loading coupons...
                        </p>
                      ) : availableCoupons.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Gift size={12} /> Available Offers
                          </p>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {availableCoupons.map((coupon) => (
                              <div
                                key={coupon.id}
                                onClick={() => handleSelectCoupon(coupon.code)}
                                className="border border-dashed border-gray-300 rounded-lg p-3 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-800 text-xs md:text-sm group-hover:text-indigo-700">
                                    {coupon.code}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                                    APPLY
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {coupon.discountType === "PERCENT"
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} FLAT OFF`}{" "}
                                  on orders above ₹{coupon.minOrderAmount}
                                </p>
                                {coupon.shopId && (
                                  <span className="text-[10px] text-orange-500 font-medium block mt-1">
                                    *Shop Specific
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-5 space-y-4 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>

                {/* <div className="flex justify-between text-gray-500">
                  <span>Product Discount</span>
                  <span>-₹{productDiscount.toLocaleString()}</span>
                </div> */}

                <div className="flex justify-between text-gray-500">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      <>₹{deliveryFee}</>
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Payable Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{total.toLocaleString()}
                    </p>
                  </div>
                  {totalSavings > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-green-600">
                        You&apos;re saving
                      </p>
                      <p className="text-sm font-semibold text-green-700">
                        ₹{totalSavings.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    navigate("/checkout", {
                      state: {
                        couponCode: couponApplied ? couponCode : null,
                        couponDiscount,
                      },
                    })
                  }
                  className="w-full mt-3 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 hover:shadow-xl active:scale-[0.99] transition-all"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span>100% secure payments and easy returns.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showClearCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowClearCartModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Clear Shopping Cart?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to remove all items from your cart? This
                action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearCartModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearCart}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-md hover:shadow-lg transition-all text-sm"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
