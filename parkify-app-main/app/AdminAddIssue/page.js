"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import supabase from "../../config/supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import { FaExclamationCircle, FaHome, FaExclamationTriangle, FaPlus } from "react-icons/fa";

const AddIssuePage = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const [formData, setFormData] = useState({
    issue_header: "",
    issue_detail: "",
    status: "Not Started",
  });
  const [adminId, setAdminId] = useState(null);

  // Function to navigate to the specified page
  const handleNavigate = (path) => {
    router.push(path);
  };

  // Check if the current path matches a specific route
  const isActive = (path) => pathname === path;

  useEffect(() => {
    const storedAdminId = sessionStorage.getItem("admin_id");
    if (storedAdminId) {
      setAdminId(storedAdminId);
    } else {
      toast.error("Admin ID not found. Please log in.");
      router.push("/Adminlogin"); // Redirect to login if admin_id is missing
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminId) {
      toast.error("Admin ID is required to add an issue.");
      return;
    }

    console.log("Admin ID:", adminId); // Debug adminId
    console.log("Form Data:", formData); // Debug formData

    // Call the stored procedure
    const { data, error } = await supabase.rpc("add_issue", {
      issue_header: formData.issue_header,
      issue_detail: formData.issue_detail,
      status: formData.status,
      admin_id: adminId,
    });

    if (error) {
      console.error("Error adding issue:", error.message || error);
      toast.error("Failed to add issue. Check console for details.");
    } else {
      console.log("Data returned:", data);
      toast.success("Issue added successfully.");
      router.push("/AdminIssue");
    }
  };


  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <Toaster position="top-center" />

      {/* Large Icon at the Top */}
      <div className="flex justify-center items-center text-red-600 mb-6">
        <FaExclamationCircle className="text-6xl" />
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">Add New Issue</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Issue Header</label>
          <input
            type="text"
            name="issue_header"
            value={formData.issue_header}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Issue Detail</label>
          <textarea
            name="issue_detail"
            value={formData.issue_detail}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Status</label>
          <input
            type="text"
            name="status"
            value="Not Started"
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-red-600"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Send Issue to Developer
        </button>
      </form>

{/* Bottom Navigation */}
<div className="fixed bottom-0 left-0 right-0 w-screen bg-white border-t border-gray-300 py-3">
  <div className="flex justify-around items-center">
    {/* Home Button - Red when in /AdminMenu or /AdminAddIssue */}
    <button
      onClick={() => handleNavigate("/AdminMenu")}
      className={(isActive("/AdminMenu")) ? "text-red-500" : "text-gray-500"}
    >
      <FaHome className="text-2xl" />
    </button>

    {/* Customer Complaint Button */}
    <button
      onClick={() => handleNavigate("/AdminCustomerComplaint")}
      className={isActive("/AdminCustomerComplaint") ||  isActive("/AdminAddIssue") ? "text-red-500" : "text-gray-500"}
    >
      <FaExclamationTriangle className="text-2xl" />
    </button>

  </div>
</div>
    </div>
  );
};

export default AddIssuePage;
