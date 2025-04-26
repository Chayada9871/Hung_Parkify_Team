"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { FaSave, FaTrashAlt, FaPlus, FaPen } from "react-icons/fa";

const CustomerComplaintEdit = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    complain_id: "",
    complain: "",
    detail: "",
    submitter_id: "",
    user_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");
    const jwtToken = sessionStorage.getItem("jwtToken");
    const complainId = sessionStorage.getItem("complain_id");

    if (!adminId || !jwtToken) {
      toast.error("Admin session missing. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    if (!complainId) {
      toast.error("Complaint ID not found");
      return;
    }

    const fetchComplaintData = async () => {
      try {
        const response = await fetch(`/api/adFetchComplaint?complainId=${complainId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error fetching complaint");

        const complaint = result.complaints[0];
        setFormData({
          complain_id: complaint.complain_id,
          complain: complaint.complain,
          detail: complaint.detail,
          submitter_id: complaint.submitter_id,
          user_type: complaint.user_type,
        });
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        toast.error("Failed to load complaint");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintData();
  }, [router]);

  const handleSaveClick = async () => {
    try {
      const jwtToken = sessionStorage.getItem("jwtToken");
      const response = await fetch("/api/adFetchComplaint", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Complaint updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Save Error:", error);
      toast.error("Failed to update complaint");
    }
  };

  const confirmDelete = async (isConfirmed, toastId) => {
    if (!isConfirmed) {
      toast.dismiss(toastId);
      return;
    }

    try {
      const jwtToken = sessionStorage.getItem("jwtToken");
      const response = await fetch(`/api/adFetchComplaint?complainId=${formData.complain_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success("Complaint deleted");
      router.push("/CustomerComplaint");
    } catch (error) {
      console.error("❌ Delete Error:", error);
      toast.error("Failed to delete complaint");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this complaint?</p>
        <div className="flex justify-end space-x-3 mt-2">
          <button onClick={() => confirmDelete(true, toastId)} className="bg-red-500 text-white px-3 py-1 rounded">
            Yes
          </button>
          <button onClick={() => toast.dismiss(toastId)} className="bg-gray-500 text-white px-3 py-1 rounded">
            No
          </button>
        </div>
      </div>,
      { position: "top-center", autoClose: false }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <Toaster />
      <button
        onClick={() => router.push("/AdminCustomerComplaint")}
        className="absolute top-10 left-4 w-12 h-12 flex justify-center items-center border rounded-lg shadow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex justify-between my-6">
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded flex items-center space-x-2">
          <FaTrashAlt /> <span>Delete</span>
        </button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FaSave /> <span>Save</span>
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FaPen /> <span>Edit</span>
          </button>
        )}
      </div>

      {/* Fields */}
      {["complain_id", "complain", "detail", "submitter_id", "user_type"].map((field) => (
        <div className="mb-4" key={field}>
          <label className="block text-gray-600 capitalize">{field.replace("_", " ")}</label>
          {field === "detail" ? (
            <textarea
              name={field}
              rows={4}
              value={formData[field]}
              onChange={handleChange}
              readOnly={!isEditing && field !== "complain_id"}
              className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"}`}
            />
          ) : (
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              readOnly={!isEditing && field !== "complain_id"}
              className={`w-full p-2 rounded border ${isEditing ? "border-blue-400" : "border-gray-300"}`}
            />
          )}
        </div>
      ))}

      {/* Add Issue Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => router.push("/AdminAddIssue")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded shadow flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add New Issue for Developer</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerComplaintEdit;
