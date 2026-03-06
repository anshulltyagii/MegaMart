import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Percent, Tag, Calendar, Store } from "lucide-react";
import { shopkeeperAPI, couponAPI } from "../../../services/api";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const shopRes = await shopkeeperAPI.shops.getMy();
      const myShops = shopRes.data || [];
      setShops(myShops);

      const myShopIds = new Set(myShops.map((s) => s.id));

      const allCouponsRes = await couponAPI.getAll();
      const allCoupons = allCouponsRes.data?.data || [];

      const relevantCoupons = allCoupons.filter((c) => {
        if (c.shopId === null || c.shopId === "" || c.shopId === 0) return true;
        return myShopIds.has(c.shopId);
      });

      const enrichedCoupons = relevantCoupons.map((c) => {
        const shop = myShops.find((s) => s.id === c.shopId);
        return {
          ...c,
          shopName: shop ? shop.name : c.shopId ? "Unknown Shop" : "All My Shops",
        };
      });

      setCoupons(enrichedCoupons);
    } catch (err) {
      console.error("Data Load Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Percent className="text-indigo-600" /> My Coupons
        </h1>

        <button
          onClick={() => {
            setEditData(null);
            setModalOpen(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 
          text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Create Coupon
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Loading coupons...</p>
      )}

      {!loading && coupons.length === 0 && (
        <div className="py-24 text-center bg-white/40 backdrop-blur-xl border rounded-2xl shadow">
          <p className="text-gray-600 text-lg">No coupons created yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 hover:shadow-2xl transition relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1 ${
                c.shopId ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
              }`}
            >
              <Store size={12} /> {c.shopName}
            </div>

            <div className="flex justify-between items-center mt-4">
              <h2 className="text-2xl font-bold flex gap-2 items-center">
                <Tag className="text-indigo-600" /> {c.code}
              </h2>

              <span className="text-indigo-700 font-bold text-lg px-3 py-1 rounded-full bg-indigo-100">
                {c.discountType === "PERCENT"
                  ? `${c.discountValue}%`
                  : `₹${c.discountValue}`}
              </span>
            </div>

            <div className="mt-4 text-gray-700 leading-relaxed">
              <p className="flex items-center gap-2">
                <Percent size={16} className="text-indigo-500" />
                Discount:{" "}
                <strong>
                  {c.discountType === "PERCENT"
                    ? `${c.discountValue}%`
                    : `₹${c.discountValue}`}
                </strong>
              </p>

              <p className="flex items-center gap-2 mt-1">
                <Calendar size={16} className="text-green-600" />
                {c.validFrom} → {c.validTo}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Min Order: ₹{c.minOrderAmount || 0}
              </p>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                onClick={() => {
                  setEditData(c);
                  setModalOpen(true);
                }}
              >
                <Pencil size={18} />
              </button>

              <button
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                onClick={async () => {
                  if (window.confirm("Delete this coupon?")) {
                    await shopkeeperAPI.coupons.delete(c.id);
                    loadData();
                  }
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <CouponModal
          shops={shops}
          editData={editData}
          close={() => setModalOpen(false)}
          refresh={loadData}
        />
      )}
    </div>
  );
}

function CouponModal({ close, refresh, editData, shops }) {
  const isEdit = !!editData;
  const today = new Date().toISOString().split("T")[0];

  const [data, setData] = useState({
    code: editData?.code || "",
    discountType: editData?.discountType || "FLAT",
    discountValue: editData?.discountValue || "",
    minOrderAmount: editData?.minOrderAmount || "",
    validFrom: editData?.validFrom || today,
    validTo: editData?.validTo || "",
    shopId:
      editData?.shopId !== undefined && editData?.shopId !== null
        ? editData.shopId
        : "",
  });

  const handleChange = (name, value) => {
    setData({ ...data, [name]: value });
  };

  const saveCoupon = async () => {
    const payload = {
      code: data.code,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderAmount: Number(data.minOrderAmount),
      validFrom: data.validFrom,
      validTo: data.validTo,
      shopId: data.shopId === "" ? null : Number(data.shopId),
    };

    if (payload.validFrom < today) {
      alert("Start date cannot be in the past!");
      return;
    }
    if (payload.validTo && payload.validTo < payload.validFrom) {
      alert("End date cannot be before the Start date!");
      return;
    }

    try {
      if (isEdit) {
        await shopkeeperAPI.coupons.update(editData.id, payload);
      } else {
        await shopkeeperAPI.coupons.create(payload);
      }
      refresh();
      close();
    } catch (err) {
      console.error("Coupon Save Error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to save coupon";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8 shadow-2xl animate-fadeSlide border max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          {isEdit ? "Edit Coupon" : "Create New Coupon"}
        </h2>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-600 font-semibold">
              Select Shop
            </label>
            <select
              value={data.shopId}
              onChange={(e) => handleChange("shopId", e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-400"
              disabled={isEdit}
            >
              <option value="">All My Shops (Apply to All)</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {data.shopId === ""
                ? "This coupon will be valid for ALL items in your shops."
                : "This coupon will ONLY work for items from the selected shop."}
            </p>
          </div>

          <Input
            label="Coupon Code"
            value={data.code}
            onChange={(v) => handleChange("code", v)}
            placeholder="e.g. SUMMER50"
          />

          <div>
            <label className="block text-sm mb-1 text-gray-600">
              Discount Type
            </label>
            <select
              value={data.discountType}
              onChange={(e) => handleChange("discountType", e.target.value)}
              className="w-full p-3 border rounded-xl bg-gray-50"
            >
              <option value="FLAT">Flat (₹)</option>
              <option value="PERCENT">Percentage (%)</option>
            </select>
          </div>

          <Input
            label="Discount Value"
            type="number"
            value={data.discountValue}
            onChange={(v) => handleChange("discountValue", v)}
            placeholder={
              data.discountType === "FLAT" ? "Amount in ₹" : "Percentage %"
            }
          />

          <Input
            label="Minimum Order Amount"
            type="number"
            value={data.minOrderAmount}
            onChange={(v) => handleChange("minOrderAmount", v)}
            placeholder="e.g. 1000"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              value={data.validFrom}
              onChange={(v) => handleChange("validFrom", v)}
              min={today}
            />

            <Input
              label="Valid To"
              type="date"
              value={data.validTo}
              onChange={(v) => handleChange("validTo", v)}
              min={data.validFrom || today}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveCoupon}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg font-bold"
          >
            {isEdit ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", min, placeholder }) {
  return (
    <div>
      <label className="block mb-1 text-sm text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        placeholder={placeholder}
        className="w-full p-3 border rounded-xl bg-gray-50 focus:bg_WHITE focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}
