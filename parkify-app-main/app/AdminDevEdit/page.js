'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const EditDeveloper = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    developer_id: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch developer data using the API
  useEffect(() => {
        if (!sessionStorage.getItem("admin_id")) {
        toast.error("Admin ID not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }
    const developerId = sessionStorage.getItem("developer_id");
    if (!developerId) {
      toast.error("Developer ID not found");
      router.push("/AdminDev");
      return;
    }

    const fetchDeveloperData = async () => {
      try {
        const response = await fetch(`/api/adFetchDev?developerId=${developerId}`);
        const result = await response.json();

        if (response.ok) {
          setFormData({
            developer_id: result.developers[0].developer_id,
            email: result.developers[0].email,
          });
        } else {
          toast.error(result.error || "Failed to fetch developer data.");
          router.push("/AdminDev");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching developer data:", error);
        toast.error("An error occurred while fetching data.");
        router.push("/AdminDev");
      }
    };

    fetchDeveloperData();
  }, [router]);

  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this developer?</p>
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
        const developerId = formData.developer_id;
        const response = await fetch(`/api/adFetchDev?developerId=${developerId}`, {
          method: "DELETE",
        });
        const result = await response.json();

        if (response.ok) {
          toast.success("Developer deleted successfully");
          router.push("/AdminDev");
        } else {
          toast.error(result.error || "Failed to delete developer.");
        }
      } catch (error) {
        console.error("Error deleting developer:", error);
        toast.error("An error occurred while deleting the developer.");
      }
    }
    toast.dismiss(toastId);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <Toaster />
      <button
        onClick={() => router.push("/AdminDev")}
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

      <div className="flex justify-between mb-4 mt-20">
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded">
          Delete
        </button>
      </div>

      {/* Developer Details */}
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Developer ID</label>
        <input
          type="text"
          name="developer_id"
          value={formData.developer_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
    </div>
  );
};

export default EditDeveloper;
