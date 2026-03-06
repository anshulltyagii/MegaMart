import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Store,
  RefreshCcw,
  Filter,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { orderAPI, returnAPI } from "../services/api";

// Helper for image URLs
const BASE_URL = "http://localhost:9192";
const getImageUrl = (path) => {
  if (!path) return "https://via.placeholder.com/100?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data State
  const [orders, setOrders] = useState([]);
  const [returnsMap, setReturnsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // UI State
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filter, setFilter] = useState("all");
  const [requestingReturnId, setRequestingReturnId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Notification State
  const [notification, setNotification] = useState(null);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  // ✅ Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    if (location.state?.message) {
      showNotification("success", location.state.message);
    }
    fetchData();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        orderAPI.getAll(),
        returnAPI.getUserReturns(),
      ]);

      const sortedOrders = (ordersRes.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);

      const returnsList = returnsRes.data?.data || returnsRes.data || [];
      const rMap = {};
      returnsList.forEach((r) => {
        rMap[r.orderId] = r.status;
      });
      setReturnsMap(rMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- STATUS HELPERS ---
  const getStatusIcon = (status) => {
    switch (status) {
      case "PLACED":
        return <Clock size={16} />;
      case "CONFIRMED":
        return <CheckCircle size={16} />;
      case "SHIPPED":
        return <Truck size={16} />;
      case "DELIVERED":
        return <CheckCircle size={16} />;
      case "CANCELLED":
        return <XCircle size={16} />;
      case "RETURNED":
        return <RefreshCcw size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      PLACED: "bg-blue-100 text-blue-800 border-blue-200",
      CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
      RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusStyle = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
      CANCELLED: "bg-gray-200 text-gray-500", // Grey out cancelled payments
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getReturnStatusStyle = (status) => {
    if (status === "APPROVED")
      return "bg-green-50 border-green-200 text-green-700";
    if (status === "REJECTED") return "bg-red-50 border-red-200 text-red-700";
    return "bg-orange-50 border-orange-200 text-orange-700";
  };

  // --- ACTIONS ---
  const handlePayNow = (order) => {
    navigate("/payment", { state: { orders: [order] } });
  };

  const initiateReturn = (order) => {
    setSelectedOrderForReturn(order);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const submitReturnRequest = async () => {
    if (!returnReason || returnReason.trim().length < 10) {
      showNotification(
        "error",
        "Please provide a detailed reason (min 10 characters)."
      );
      return;
    }

    const targetOrderId =
      selectedOrderForReturn.orderId || selectedOrderForReturn.id;
    setRequestingReturnId(targetOrderId);
    setIsReturnModalOpen(false);

    try {
      await returnAPI.request({
        orderId: targetOrderId,
        reason: returnReason,
      });
      showNotification("success", "Return request submitted successfully");
      fetchData();
    } catch (error) {
      console.error("Error requesting return:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to submit return request";
      showNotification("error", msg);
    } finally {
      setRequestingReturnId(null);
      setSelectedOrderForReturn(null);
    }
  };

  // ✅ OPEN CANCEL MODAL
  const confirmCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  // ✅ EXECUTE CANCEL LOGIC
  const executeCancelOrder = async () => {
    if (!orderToCancel) return;
    const targetOrderId = orderToCancel.orderId || orderToCancel.id;

    setCancellingOrderId(targetOrderId);
    setShowCancelModal(false);

    try {
      await orderAPI.cancel(targetOrderId);
      showNotification("success", "Order cancelled successfully");

      // ✅ Optimistic UI Update: Prevent "Pending" from showing by updating local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          const oId = o.orderId || o.id;
          if (oId === targetOrderId) {
            return {
              ...o,
              status: "CANCELLED",
              paymentStatus: "CANCELLED", // Override payment status to hide Pending
            };
          }
          return o;
        })
      );

      // Refetch to be sure
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error("Error cancelling order:", error);
      const msg = error.response?.data?.message || "Failed to cancel order";
      showNotification("error", msg);
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.paymentStatus === "PENDING";
    if (filter === "active")
      return ["PLACED", "CONFIRMED", "SHIPPED"].includes(order.status);
    if (filter === "completed") return order.status === "DELIVERED";
    if (filter === "cancelled")
      return ["CANCELLED", "RETURNED"].includes(order.status);
    return true;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.paymentStatus === "PENDING").length,
    active: orders.filter((o) =>
      ["PLACED", "CONFIRMED", "SHIPPED"].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      {/* ✅ CUSTOM NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed top-24 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 animate-slide-in ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
          <div>
            <h4 className="font-bold text-lg">
              {notification.type === "success" ? "Success" : "Error"}
            </h4>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 hover:bg-white/20 p-1 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ✅ CANCEL CONFIRMATION MODAL (No Browser Alert) */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Cancel Order?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel Order #
              {orderToCancel?.orderNumber}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={executeCancelOrder}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RETURN MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                Request Return
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm mb-4 flex gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p>
                  Please tell us why you are returning this item. Your feedback
                  helps us improve.
                </p>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason for Return
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="E.g. The size didn't fit, or the quality wasn't as expected..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {returnReason.length}/10 characters minimum
              </p>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReturnRequest}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            My Orders
          </h1>
          <p className="text-gray-600">{orders.length} total orders</p>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {orderStats.total}
              </p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {orderStats.pending}
              </p>
              <p className="text-sm text-gray-500">Pending Payment</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orderStats.active}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {orderStats.delivered}
              </p>
              <p className="text-sm text-gray-500">Delivered</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {["all", "pending", "active", "completed", "cancelled"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors capitalize ${
                    filter === tab
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab === "completed" ? "Delivered" : tab}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders match this filter</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const currentId = order.orderId || order.id;
              const returnStatus = returnsMap[currentId];

              return (
                <div
                  key={currentId}
                  className="bg-white rounded-2xl shadow-soft overflow-hidden"
                >
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Order
                          </p>
                          <p className="font-bold text-gray-900">
                            #{order.orderNumber}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Date
                          </p>
                          <p className="text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Shop
                          </p>
                          <p className="text-sm text-gray-900 flex items-center gap-1">
                            <Store size={14} />
                            {order.shopName || "Shop"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                        {/* ✅ FIXED: Hide payment status if cancelled or show grey */}
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${getPaymentStatusStyle(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-3">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 bg-gray-100 rounded-lg border-2 border-white overflow-hidden"
                          >
                            <img
                              src={getImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-full h-full object-contain p-1"
                              onError={(e) =>
                                (e.target.src =
                                  "https://via.placeholder.com/100?text=No+Image")
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {order.items?.length || 0} item(s)
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items?.[0]?.productName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₹{order.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Pay Now */}
                      {order.paymentStatus === "PENDING" &&
                        order.status === "PLACED" && (
                          <button
                            onClick={() => handlePayNow(order)}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"
                          >
                            <CreditCard size={18} /> Pay Now
                          </button>
                        )}

                      {/* ✅ CANCEL BUTTON (Opens Modal) */}
                      {["PLACED", "CONFIRMED"].includes(order.status) && (
                        <button
                          onClick={() => confirmCancelOrder(order)}
                          disabled={cancellingOrderId === currentId}
                          className="px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          {cancellingOrderId === currentId ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <XCircle size={18} />
                          )}
                          Cancel Order
                        </button>
                      )}

                      {/* Return Logic */}
                      {order.status === "DELIVERED" &&
                        (returnStatus ? (
                          <div
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-default border ${getReturnStatusStyle(
                              returnStatus
                            )}`}
                          >
                            <RefreshCcw size={18} />
                            Return: {returnStatus}
                          </div>
                        ) : (
                          <button
                            onClick={() => initiateReturn(order)}
                            className="px-5 py-2.5 border-2 border-orange-200 text-orange-600 rounded-xl font-bold hover:bg-orange-50 flex items-center gap-2"
                          >
                            <RefreshCcw size={18} /> Request Return
                          </button>
                        ))}

                      <button
                        onClick={() =>
                          setExpandedOrder(
                            expandedOrder === currentId ? null : currentId
                          )
                        }
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
                      >
                        View Details
                        {expandedOrder === currentId ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>

                      {/* {["SHIPPED", "CONFIRMED"].includes(order.status) && (
                        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                          <Truck size={18} /> Track
                        </button>
                      )} */}
                    </div>

                    {expandedOrder === currentId && (
                      <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4">
                              Order Items
                            </h4>
                            <div className="space-y-3">
                              {(order.items || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 p-3 bg-gray-50 rounded-xl"
                                >
                                  <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0">
                                    <img
                                      src={getImageUrl(item.productImage)}
                                      alt={item.productName}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) =>
                                        (e.target.src =
                                          "https://via.placeholder.com/100?text=No+Image")
                                      }
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">
                                      {item.productName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Qty: {item.quantity}
                                    </p>
                                    <p className="font-bold text-gray-900">
                                      ₹{item.unitPrice?.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <MapPin size={18} /> Shipping Address
                              </h4>
                              <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-4">
                                {order.shippingAddress}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
