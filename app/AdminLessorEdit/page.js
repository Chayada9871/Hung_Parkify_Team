"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';

const EditLessor = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    lessor_id: "",
    lessor_firstname: "",
    lessor_lastname: "",
    lessor_phone_number: "",
    lessor_line_url: "",
    lessor_email: "",
    lessor_profile_pic: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem("admin_id")) {
      toast.error("Admin ID not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }
    const fetchLessorData = async () => {
      const lessor_id = sessionStorage.getItem("lessor_id");
      const jwtToken = sessionStorage.getItem("jwtToken");

      if (!lessor_id || !jwtToken) {
        toast.error("Missing required information. Redirecting...");
        router.push("/AdminLessor");
        return;
      }

      try {
        const response = await fetch(`/api/adFetchLessor?lessor_id=${lessor_id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`
          }
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(`Error ${response.status}: ${errorDetails.error}`);
        }

        const { lessorDetails } = await response.json();
        const data = lessorDetails[0];
        setFormData({
          lessor_id: data.lessor_id || "",
          lessor_firstname: data.lessor_firstname || "",
          lessor_lastname: data.lessor_lastname || "",
          lessor_phone_number: data.lessor_phone_number || "",
          lessor_line_url: data.lessor_line_url || "",
          lessor_email: data.lessor_email || "",
          lessor_profile_pic: data.lessor_profile_pic || ""
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching lessor data:", error.message);
        toast.error(`Failed to fetch lessor data: ${error.message}`);
        router.push("/AdminLessor");
      }
    };
    fetchLessorData();
  }, [router]);

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    const jwtToken = sessionStorage.getItem("jwtToken");
    try {
      const response = await fetch("/api/adFetchLessor", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          lessor_id: formData.lessor_id,
          lessor_firstname: formData.lessor_firstname,
          lessor_lastname: formData.lessor_lastname,
          lessor_phone_number: formData.lessor_phone_number,
          lessor_line_url: formData.lessor_line_url
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Failed to update lessor: ${errorDetails.error}`);
      }

      const data = await response.json();
      toast.success(data.message || "Lessor information updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Update Error:", error.message);
      toast.error(error.message);
    }
  };

  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this lessor?</p>
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
        duration: Infinity,
        closeOnClick: false
      }
    );
  };

  const confirmDelete = async (isConfirmed, toastId) => {
    if (isConfirmed) {
      const jwtToken = sessionStorage.getItem("jwtToken");
      try {
        const response = await fetch("/api/adFetchLessor", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ lessor_id: formData.lessor_id })
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(`Failed to delete lessor: ${errorDetails.error}`);
        }

        const data = await response.json();
        toast.success(data.message || "Lessor deleted successfully");
        router.push("/AdminLessor");
      } catch (error) {
        console.error("Delete Error:", error.message);
        toast.error(error.message);
      }
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
        onClick={() => router.push("/AdminLessor")}
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

      {formData.lessor_profile_pic && (
        <div className="mb-2 mt-20">
          <img
            src={formData.lessor_profile_pic}
            alt="Lessor Profile"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex justify-between mb-2 mt-8">
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        ) : (
          <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Lessor ID</label>
        <input
          type="text"
          name="lessor_id"
          value={formData.lessor_id || ""}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">First Name</label>
        <input
          type="text"
          name="lessor_firstname"
          value={formData.lessor_firstname || ""}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Last Name</label>
        <input
          type="text"
          name="lessor_lastname"
          value={formData.lessor_lastname || ""}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Phone Number</label>
        <input
          type="text"
          name="lessor_phone_number"
          value={formData.lessor_phone_number || ""}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">LINE URL</label>
        <input
          type="text"
          name="lessor_line_url"
          value={formData.lessor_line_url || ""}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Email</label>
        <input
          type="email"
          name="lessor_email"
          value={formData.lessor_email || ""}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
    </div>
  );
};

export default EditLessor;