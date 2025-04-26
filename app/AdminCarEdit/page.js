"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const EditCar = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    car_id: "",
    user_id: "",
    car_model: "",
    car_color: "",
    license_plate: "",
    carimage: "",
    signatures_valid: {} // 🆕 To store signature validation
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");
    const jwtToken = sessionStorage.getItem("jwtToken");
    const carId = sessionStorage.getItem("car_id");

    if (!adminId || !jwtToken) {
      toast.error("Admin ID or Token missing. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    if (!carId) {
      toast.error("Car ID is missing.");
      router.push("/AdminCar");
      return;
    }

    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/upFetchCars?car_id=${carId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        });

        const rawText = await response.text();
        const json = JSON.parse(rawText);

        if (!response.ok) throw new Error(json.error || "Failed to fetch car data");

        const car = json.car;

        setFormData({
          car_id: car.car_id,
          user_id: car.user_id,
          car_model: car.car_model,
          car_color: car.car_color,
          license_plate: car.license_plate,
          carimage: car.carimage || "",
          signatures_valid: car.signatures_valid || {}
        });

        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching car:", error.message);
        toast.error("Failed to fetch car");
        router.push("/AdminCar");
      }
    };

    fetchCar();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    try {
      const response = await fetch("/api/updateCar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          carId: formData.car_id,
          licensePlate: formData.license_plate,
          carModel: formData.car_model,
          carColor: formData.car_color
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Update failed");

      toast.success(data.message || "Car updated");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Update Error:", error.message);
      toast.error(error.message);
    }
  };

  const confirmDelete = async () => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    try {
      const response = await fetch(`/api/updateCar?car_id=${formData.car_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Delete failed");

      toast.success(data.message || "Car deleted");
      router.push("/AdminCar");
    } catch (error) {
      console.error("❌ Delete Error:", error.message);
      toast.error(error.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <Toaster />

      <button
        onClick={() => router.push("/AdminCar")}
        className="absolute top-10 left-4 flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 shadow-sm text-black"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {formData.carimage && (
        <div className="mb-4 mt-20">
          <img src={formData.carimage} alt="Car" className="w-full h-48 object-cover rounded-lg" />
        </div>
      )}

      <div className="flex justify-between mb-4 mt-20">
        <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        ) : (
          <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
        )}
      </div>

      {["car_id", "user_id"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block text-gray-500 mb-1">{field.replace("_", " ").toUpperCase()}</label>
          <input value={formData[field] || ""} readOnly className="w-full p-2 rounded border border-gray-300 bg-gray-100" />
        </div>
      ))}

      {["car_model", "car_color", "license_plate"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block text-gray-500 mb-1">
            {field.replace("_", " ").toUpperCase()}
            {formData.signatures_valid?.[field] === false && (
              <span className="text-red-500 text-sm"> ⚠️ Invalid Signature</span>
            )}
          </label>
          <input
            name={field}
            value={formData[field]}
            onChange={handleChange}
            readOnly={!isEditing}
            className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"}`}
          />
        </div>
      ))}
    </div>
  );
};

export default EditCar;
