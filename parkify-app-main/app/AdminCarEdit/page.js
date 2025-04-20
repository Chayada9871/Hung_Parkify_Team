"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../config/supabaseClient";
import toast, { Toaster } from 'react-hot-toast';




const EditCar = () => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    car_id: "",
    user_id: "",
    car_model: "",
    car_color: "",
    license_plate: "",
    car_image: ""
  });
  const [loading, setLoading] = useState(true);

  // Fetch car data
  useEffect(() => {
        if (!sessionStorage.getItem("admin_id")) {
        toast.error("Admin ID not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }
    const carId = sessionStorage.getItem("car_id");
    if (!carId) {
      toast.error("Car ID not found");
      router.push("/AdminCar");
      return;
    }


     const fetchCar = async () => {
      try {
        const response = await fetch(`/api/updateCar?car_id=${carId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch car data");
        }

        const { car } = await response.json();
        setFormData({
          car_id: car.car_id,
          user_id: car.user_id,
          car_model: car.car_model,
          car_color: car.car_color,
          license_plate: car.license_plate,
          car_image: car.car_image || "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching car data:", error);
        toast.error("Failed to fetch car data.");
        router.push("/AdminCar");
      }
    };

    fetchCar();
  }, [router]);


  const handleEditClick = () => setIsEditing(true);


  const handleSaveClick = async () => {
    try {
      const response = await fetch(`/api/updateCar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_id: formData.car_id,
          car_model: formData.car_model,
          car_color: formData.car_color,
          license_plate: formData.license_plate,
        }),
      });
  
      // Check if the response is OK and that it has JSON content
      if (!response.ok) {
        throw new Error(`Failed to update car: ${errorDetails.error}`);
      }
  
      // If response is OK and JSON, proceed
      const data = await response.json();
      toast.success(data.message || "Car information updated successfully");
      setIsEditing(false);
    } catch (error) {}
  };


  
  
  

  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this car?</p>
        <div className="flex justify-between mt-2">
          <button
            onClick={() => confirmDelete(true, toastId)}
            className="bg-red-500 text-white px-3 py-1 rounded mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(toastId)} // Dismiss the specific toast
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

 const confirmDelete = async (isConfirmed, toastId) => {
    if (isConfirmed) {
      const response = await fetch('/api/updateCar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car_id: formData.car_id }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete car: ${errorDetails.error}`);
      }
      const data = await response.json();
      toast.success(data.message || "Car information delete successfully");
      router.push("/AdminCar");
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <Toaster />
      <button
        onClick={() => router.push("/AdminCar")}
        className="absolute top-10 left-4 flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 shadow-sm text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Display the car image */}
      {formData.car_image && (
        <div className="mb-4 mt-20">
          <img
            src={formData.car_image}
            alt="Car Image"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex justify-between mb-4 mt-20">
        <Toaster position="top-center" />
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        ) : (
          <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
        )}
      </div>

      {/* Car Details */}
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Car ID</label>
        <input
          type="text"
          name="car_id"
          value={formData.car_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">User ID</label>
        <input
          type="text"
          name="user_id"
          value={formData.user_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Car Model</label>
        <input
          type="text"
          name="car_model"
          value={formData.car_model}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Car Color</label>
        <input
          type="text"
          name="car_color"
          value={formData.car_color}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">License Plate</label>
        <input
          type="text"
          name="license_plate"
          value={formData.license_plate}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
    </div>
  );
};

export default EditCar;
