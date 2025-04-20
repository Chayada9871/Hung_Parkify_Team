"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditUser = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwtToken = sessionStorage.getItem("jwtToken");
    if (!jwtToken) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchUserData = async () => {
      const userId = sessionStorage.getItem("user_id");
      if (!userId) {
        toast.error("User ID is missing. Redirecting...");
        router.push("/AdminRenter");
        return;
      }

      try {
        const response = await fetch(`/api/adFetchRenter?userId=${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include the JWT token in the header
          },
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(`Error ${response.status}: ${errorDetails.error}`);
        }

        const { renterDetails } = await response.json();

        setFormData({
          userId: renterDetails[0].user_id,
          firstName: renterDetails[0].first_name,
          lastName: renterDetails[0].last_name,
          phoneNumber: renterDetails[0].phone_number,
          username: renterDetails[0].username,
          email: renterDetails[0].email,
          password: "", // Password should generally be hidden or managed separately
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error.message);
        toast.error(`Failed to fetch user data: ${error.message}`);
        router.push("/AdminRenter");
      }
    };

    fetchUserData();
  }, [router]);

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    const jwtToken = sessionStorage.getItem("jwtToken");
    if (!jwtToken) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    try {
      const response = await fetch(`/api/adFetchRenter`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`, // Include the JWT token in the header
        },
        body: JSON.stringify({
          userId: formData.userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
        }),
      });

      // Check if response is not OK and has no content
      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json(); // Try parsing JSON
        } catch (err) {
          errorDetails = { error: `HTTP ${response.status}: No additional details provided` }; // Fallback if JSON is missing
        }
        throw new Error(`Failed to update user: ${errorDetails.error}`);
      }

      toast.success("User information updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user data:", error.message);
      toast.error(`Failed to update user: ${error.message}`);
    }
  };


  const handleDeleteClick = () => {
    toast.warn(
      <div>
        <p>Are you sure you want to delete this user?</p>
        <div className="flex justify-between mt-2">
          <button
            onClick={() => confirmDelete(true)}
            className="bg-red-500 text-white px-3 py-1 rounded mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => confirmDelete(false)}
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
        toastId: "delete-confirm-toast",
      }
    );
  };

  const confirmDelete = async (isConfirmed) => {
    if (isConfirmed) {
      const jwtToken = sessionStorage.getItem("jwtToken");
      if (!jwtToken) {
        toast.error("Authentication token not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }

      try {
        const response = await fetch(`/api/adFetchRenter?userId=${formData.userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include the JWT token in the header
          },
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          console.error("Error deleting user:", errorDetails.error);
          throw new Error(`Failed to delete user: ${errorDetails.error}`);
        }

        toast.success("User deleted successfully");
        router.push("/AdminRenter");
      } catch (error) {
        console.error("Error deleting user:", error.message);
        toast.error(`Failed to delete user: ${error.message}`);
      }
    } else {
      toast.dismiss("delete-confirm-toast");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <button
        onClick={() => router.push("/AdminRenter")}
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

      <div className="flex justify-between mb-4 mt-20">
        <button
          onClick={handleDeleteClick}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
        {isEditing ? (
          <button
            onClick={handleSaveClick}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        ) : (
          <button
            onClick={handleEditClick}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">User ID</label>
        <input
          type="text"
          name="userId"
          value={formData.userId}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"
            }`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"
            }`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Phone Number</label>
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"
            }`}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Email</label>
        <input
          type="text"
          name="email"
          value={formData.email}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default EditUser;
