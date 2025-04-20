"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FaEdit } from "react-icons/fa";

const EditParkingLot = () => {
  const router = useRouter();
  const fileUploadRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    parking_lot_id: "",
    location_name: "",
    address: "",
    location_url: "",
    total_slots: "",
    price_per_hour: "",
    location_image: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch parking lot data
  useEffect(() => {
    const jwtToken = sessionStorage.getItem("jwtToken");
    if (!jwtToken) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const parkingLotId = sessionStorage.getItem("parking_lot_id");
    if (!parkingLotId) {
      toast.error("Parking lot ID not found");
      router.push("/AdminParking");
      return;
    }

    const fetchParkingLotData = async () => {
      try {
        const response = await fetch(`/api/adFetchPark?parkingLotId=${parkingLotId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include JWT in header
          },
        });

        if (!response.ok) throw new Error("Failed to fetch parking lot data");

        const { parkingLotDetails } = await response.json();
        const data = parkingLotDetails[0];

        setFormData({
          parking_lot_id: data.parking_lot_id,
          location_name: data.location_name,
          address: data.address,
          location_url: data.location_url,
          total_slots: data.total_slots,
          price_per_hour: data.price_per_hour,
          location_image: data.location_image || "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching parking lot data:", error);
        toast.error("Failed to fetch parking lot data.");
        router.push("/AdminParking");
      }
    };

    fetchParkingLotData();
  }, [router]);

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    try {
      const jwtToken = sessionStorage.getItem("jwtToken");
      if (!jwtToken) {
        toast.error("Authentication token not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }

      let newImagePath = formData.location_image;
      const fileInput = fileUploadRef.current;

      if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("storageBucket", "carpark");
        formDataUpload.append("parkingLotId", formData.parking_lot_id);

        const uploadResponse = await fetch("/api/uploadParking", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include JWT in header
          },
          body: formDataUpload,
        });

        if (!uploadResponse.ok) throw new Error("File upload failed");

        const uploadResult = await uploadResponse.json();
        newImagePath = uploadResult.publicUrl;
      }

      const response = await fetch("/api/adFetchPark", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`, // Include JWT in header
        },
        body: JSON.stringify({
          parkingLotId: formData.parking_lot_id,
          locationName: formData.location_name,
          address: formData.address,
          locationUrl: formData.location_url,
          totalSlots: formData.total_slots,
          pricePerHour: formData.price_per_hour,
          locationImage: newImagePath,
        }),
      });

      if (!response.ok) throw new Error("Failed to update parking lot information");

      toast.success("Parking lot information updated successfully");
      setFormData((prevState) => ({ ...prevState, location_image: newImagePath }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating parking lot data:", error);
      toast.error("Failed to update parking lot information.");
    }
  };

  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this parking lot?</p>
        <div className="flex justify-between mt-2">
          <button
            onClick={() => confirmDelete(true, toastId)}
            className="bg-red-500 text-white px-3 py-1 rounded mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
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
      try {
        const jwtToken = sessionStorage.getItem("jwtToken");
        if (!jwtToken) {
          toast.error("Authentication token not found. Please log in.");
          router.push("/AdminLogin");
          return;
        }

        const response = await fetch(`/api/adFetchPark?parkingLotId=${formData.parking_lot_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include JWT in header
          },
        });

        if (!response.ok) throw new Error("Failed to delete parking lot");

        toast.success("Parking lot deleted successfully");
        router.push("/AdminParking");
      } catch (error) {
        console.error("Error deleting parking lot:", error);
        toast.error("Failed to delete parking lot.");
      }
    }
    toast.dismiss(toastId);
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
        onClick={() => router.push("/AdminParking")}
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {formData.location_image && (
        <div className="mb-4 mt-20">
          <img
            src={formData.location_image}
            alt="Current location"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex justify-between mb-4 mt-16">
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        ) : (
          <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Parking Lot ID</label>
        <input
          type="text"
          name="parking_lot_id"
          value={formData.parking_lot_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Location Name</label>
        <input
          type="text"
          name="location_name"
          value={formData.location_name}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Location URL</label>
        <input
          type="text"
          name="location_url"
          value={formData.location_url}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Total Slots</label>
        <input
          type="number"
          name="total_slots"
          value={formData.total_slots}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Price per Hour</label>
        <input
          type="number"
          name="price_per_hour"
          value={formData.price_per_hour}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Location Image</label>
        <input
          ref={fileUploadRef}
          type="file"
          accept="image/*"
          className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"
            }`}
          disabled={!isEditing}
        />
      </div>
    </div>
  );
};

export default EditParkingLot;
