import React, { useState } from "react";
import AddressForm from "../../components/address/AddressForm";
import { addressAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function AddAddressPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    landmark: "",
    addressType: "HOME",
    isDefault: false,
  });
  
  // ✅ NEW
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("User ID not found. Please login again.");
        return;
    }
    
    try {
      await addressAPI.create(userId, form);
      navigate("/addresses");
    } catch (err) {
      console.error("Add address error:", err);
      alert("Failed to add address");
    }
};



  return (
    <div className="min-h-screen p-6 bg-gray-50 flex justify-center">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Add New Address</h2>

        <AddressForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          buttonLabel="Save Address"
        />
      </div>
    </div>
  );
}