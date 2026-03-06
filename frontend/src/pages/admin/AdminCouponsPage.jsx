import React, { useEffect, useState, useMemo } from "react";
import { adminAPI } from "../../services/api";
import { Pencil, Trash2, Plus, Percent, Tag } from "lucide-react";

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  // ---------------------------------------------------------
  // LOCAL DATE FIX (no UTC conversion)
  // ---------------------------------------------------------
  const getLocalDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ---------------------------------------------------------
  // FINAL ACTIVE STATUS LOGIC
  // Active = (isActive = true) AND (today inside date range)
  // ---------------------------------------------------------
  const isCouponActive = (c) => {
    const today = getLocalDate();
    return c.active === true && today >= c.validFrom && today <= c.validTo;
  };

  // ---------------------------------------------------------
  // LOAD COUPONS
  // ---------------------------------------------------------
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.coupons.getAll();
      const list = res.data || [];
      setCoupons(list);
      setFiltered(list);
      console.log("Backend coupons response:",JSON.stringify(list,null,2));
    } catch (err) {
      console.error("Failed to load coupons", err);
      alert("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------
  useEffect(() => {
    let list = [...coupons];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.discountType.toLowerCase().includes(term)
      );
    }

    setFiltered(list);
  }, [search, coupons]);

  // ---------------------------------------------------------
  // ANALYTICS (using correct active status)
  // ---------------------------------------------------------
  const analytics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => isCouponActive(c)).length;
    return { total, active, inactive: total - active };
  }, [coupons]);

  // ---------------------------------------------------------
  // DELETE COUPON
  // ---------------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      await adminAPI.coupons.delete(id);
      await loadCoupons();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete coupon");
    }
  };

  // ---------------------------------------------------------
  // MODAL FORM STATE
  // ---------------------------------------------------------
  const [form, setForm] = useState({
    code: "",
    discountType: "FLAT",
    discountValue: "",
    minOrderAmount: "",
    validFrom: "",
    validTo: "",
    shopId: null,
  });

  const openForCreate = () => {
    setEditCoupon(null);
    setForm({
      code: "",
      discountType: "FLAT",
      discountValue: "",
      minOrderAmount: "",
      validFrom: "",
      validTo: "",
      shopId: null,
    });
    setShowModal(true);
  };

  const openForEdit = (c) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      validFrom: c.validFrom,
      validTo: c.validTo,
      shopId: c.shopId,
    });
    setShowModal(true);
  };

  // ---------------------------------------------------------
  // SAVE (CREATE / UPDATE)
  // ---------------------------------------------------------
  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        shopId: form.shopId || null,
      };

      if (editCoupon) {
        await adminAPI.coupons.update(editCoupon.id, payload);
      } else {
        await adminAPI.coupons.create(payload);
      }

      setShowModal(false);
      await loadCoupons();
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save coupon");
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between mb-5">
        <h1 className="text-3xl font-bold">Admin — Coupons</h1>

        <button
          onClick={openForCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      {/* ANALYTICS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-xl p-4 shadow">
          <Tag className="text-indigo-600" />
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold">{analytics.total}</p>
        </div>

        <div className="border rounded-xl p-4 shadow">
          <Percent className="text-green-600" />
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-xl font-bold">{analytics.active}</p>
        </div>

        
      </div>

      {/* SEARCH */}
      <input
        type="text"
        className="border rounded-lg px-4 py-2 w-full mb-4"
        placeholder="Search coupons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-2">Code</th>
              <th className="p-2">Type</th>
              <th className="p-2">Value</th>
              <th className="p-2">Min Order</th>
              <th className="p-2">Valid</th>
              <th className="p-2">Active</th>
              <th className="p-2">Shop</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{c.code}</td>
                <td className="p-2">{c.discountType}</td>
                <td className="p-2">{c.discountValue}</td>
                <td className="p-2">{c.minOrderAmount}</td>
                <td className="p-2">
                  {c.validFrom} → {c.validTo}
                </td>

                {/* FINAL FIXED ACTIVE STATUS */}
                <td className="p-2 font-semibold">
                  {isCouponActive(c) ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </td>

                <td className="p-2">{c.shopId ? `Shop #${c.shopId}` : "Admin"}</td>

                <td className="p-2 flex gap-3">
                  <Pencil
                    className="text-blue-600 cursor-pointer"
                    onClick={() => openForEdit(c)}
                  />
                  <Trash2
                    className="text-red-600 cursor-pointer"
                    onClick={() => handleDelete(c.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center py-6 text-gray-500">No coupons found.</p>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editCoupon ? "Edit Coupon" : "Add Coupon"}
            </h2>

            <div className="flex flex-col gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />

              <select
                className="border p-2 rounded"
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
              >
                <option value="FLAT">FLAT</option>
                <option value="PERCENT">PERCENT</option>
              </select>

              <input
                className="border p-2 rounded"
                placeholder="Discount Value"
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
              />

              <input
                className="border p-2 rounded"
                placeholder="Minimum Order Amount"
                type="number"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: e.target.value })
                }
              />

              <input
                type="date"
                className="border p-2 rounded"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
              />

              <input
                type="date"
                className="border p-2 rounded"
                value={form.validTo}
                onChange={(e) =>
                  setForm({ ...form, validTo: e.target.value })
                }
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCouponsPage;
