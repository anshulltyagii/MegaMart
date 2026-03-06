import React, { useEffect, useState } from "react";
import { addressAPI } from "../../services/api";
import AddressForm from "../../components/address/AddressForm";
import { useNavigate, useParams } from "react-router-dom";

export default function EditAddressPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);

// ✅ NEW
useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    addressAPI.getById(id, userId)
      .then((res) => setForm(res.data))
      .catch(() => alert("Failed to load address"));
}, [id]);

  // ✅ NEW
const handleSubmit = async (e) => {
    e.preventDefault();
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("User ID not found. Please login again.");
        return;
    }
    
    try {
      await addressAPI.update(id, userId, form);
      navigate("/addresses");
    } catch (err) {
      console.error("Update address error:", err);
      alert("Failed to update address");
    }
};

  if (!form) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex justify-center">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Edit Address</h2>

        <AddressForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          buttonLabel="Update Address"
        />
      </div>
    </div>
  );
}