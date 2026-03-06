import React from "react";

export default function AddressForm({ form, setForm, onSubmit, buttonLabel }) {

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Full Name */}
      <input
        type="text"
        name="fullName"
        placeholder="Full Name"
        className="input w-full"
        value={form.fullName}
        onChange={handleChange}
        required
      />

      {/* Phone */}
      <input
        type="text"
        name="phone"
        placeholder="Phone Number"
        maxLength="10"
        className="input w-full"
        value={form.phone}
        onChange={handleChange}
        required
      />

      {/* Pincode */}
      <input
        type="text"
        name="pincode"
        placeholder="Pincode"
        maxLength="6"
        className="input w-full"
        value={form.pincode}
        onChange={handleChange}
        required
      />

      {/* Address Line 1 */}
      <input
        type="text"
        name="addressLine1"
        placeholder="House / Street"
        className="input w-full"
        value={form.addressLine1}
        onChange={handleChange}
        required
      />

      {/* Address Line 2 */}
      <input
        type="text"
        name="addressLine2"
        placeholder="Area / Locality (optional)"
        className="input w-full"
        value={form.addressLine2}
        onChange={handleChange}
      />

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="city"
          placeholder="City"
          className="input w-full"
          value={form.city}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          className="input w-full"
          value={form.state}
          onChange={handleChange}
          required
        />
      </div>

      {/* Landmark */}
      <input
        type="text"
        name="landmark"
        placeholder="Landmark (optional)"
        className="input w-full"
        value={form.landmark}
        onChange={handleChange}
      />

      {/* Address Type — Stylish Cards */}
      <div>
        <p className="text-sm font-medium mb-2">Address Type</p>

        <div className="grid grid-cols-2 gap-4">
          {/* HOME card */}
          <div
            className={`border rounded-xl p-4 cursor-pointer text-center font-semibold ${
              form.addressType === "HOME"
                ? "border-primary bg-pink-50 text-primary"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setForm({ ...form, addressType: "HOME" })}
          >
            HOME
          </div>

          {/* WORK card */}
          <div
            className={`border rounded-xl p-4 cursor-pointer text-center font-semibold ${
              form.addressType === "WORK"
                ? "border-primary bg-pink-50 text-primary"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setForm({ ...form, addressType: "WORK" })}
          >
            WORK
          </div>
        </div>
      </div>

      {/* Default Checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm({ ...form, isDefault: e.target.checked })
          }
        />
        <span>Make this my default address</span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
