'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import toast, { Toaster } from 'react-hot-toast';
import supabase from "../../config/supabaseClient";

const EditIssue = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    issue_id: "",
    admin_id: "",
    issue_header: "",
    issue_detail: "",
    status: "Not Started",
    resolved_by: ""
  });
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);


  
  useEffect(() => {
    
     if (!sessionStorage.getItem("admin_id")) {
      toast.error("Admin ID not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const issueId = sessionStorage.getItem("issue_id");
   
    const fetchIssueById = async (issueId) => {
      try {
        const { data, error } = await supabase.rpc("get_issue", { issue_id_input: parseInt(issueId) });

        if (error) {
          console.error("Error fetching issue:", error);
          setError("Failed to fetch issue details.");
        } else {
          const issueData = data[0]; // Assuming data is an array
          setFormData({
            issue_id: issueData.issue_id,
            admin_id: issueData.admin_id,
            issue_header: issueData.issue_header,
            issue_detail: issueData.issue_detail,
            status: issueData.status || "Not Started",
            resolved_by: issueData.resolved_by || "",
          });
          console.log("Fetched issue:", issueData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchIssueById(issueId);
  }, [router]);

  const handleEditClick = () => setIsEditing(true);

 
 const handleSaveClick = async () => {
  try {
    const response = await fetch(`/api/adFetchIssue`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue_id: formData.issue_id,
        admin_id: formData.admin_id,
        issue_header: formData.issue_header,
        issue_detail: formData.issue_detail,
        resolved_by: formData.resolved_by || null,
        status: formData.status, // Ensure this is passed
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(`Failed to update issue: ${errorDetails.error}`);
    }

    toast.success("Issue information updated successfully");
    setIsEditing(false);
  } catch (error) {
    console.error("Save error:", error);
    toast.error(error.message || "Error saving data");
  }
};
  
  
  const handleDeleteClick = () => {
    const toastId = toast(
      <div>
        <p>Are you sure you want to delete this issue?</p>
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

  const confirmDelete = async (isConfirmed) => {
    if (isConfirmed) {
      try {
        const response = await fetch(`/api/adFetchIssue?issue_id=${formData.issue_id}`, {
          method: "DELETE",
        });
  
        // Log response status and potential errors
        console.log("DELETE response status:", response.status);
  
        if (!response.ok) {
          const errorDetails = await response.json();
          console.error("Error deleting user:", errorDetails.error);
          throw new Error(`Failed to delete user: ${errorDetails.error}`);
        }
  
        toast.success("User deleted successfully");
        router.push("/AdminIssue");
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
      <Toaster />
      <button
        onClick={() => router.push("/AdminIssue")}
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


      <div className="flex justify-between mb-4 mt-24">
        <Toaster position="top-center" />
        <button onClick={handleDeleteClick} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
        {isEditing ? (
          <button onClick={handleSaveClick} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
        ) : (
          <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded">Edit</button>
        )}
      </div>

      {/* Issue Details */}
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Issue ID</label>
        <input
          type="text"
          name="issue_id"
          value={formData.issue_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Admin ID</label>
        <input
          type="text"
          name="admin_id"
          value={formData.admin_id}
          readOnly
          className="w-full p-2 rounded border border-gray-300 bg-gray-100"
          />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Issue Header</label>
        <input
          type="text"
          name="issue_header"
          value={formData.issue_header}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Issue Detail</label>
        <textarea
          name="issue_detail"
          value={formData.issue_detail}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
          rows={4}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          disabled={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-500 mb-1">Resolved By</label>
        <input
          type="text"
          name="resolved_by"
          value={formData.resolved_by}
          onChange={handleChange}
          readOnly={!isEditing}
          className={`w-full p-2 rounded border ${isEditing ? 'border-blue-400' : 'border-gray-300'}`}
        />
      </div>
    </div>
  );
};

export default EditIssue;
