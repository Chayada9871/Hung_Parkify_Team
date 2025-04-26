"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { FaExclamationCircle, FaHome, FaExclamationTriangle } from "react-icons/fa";

const AddIssuePage = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [formData, setFormData] = useState({
    issue_header: "",
    issue_detail: "",
    status: "Not Started",
  });

  const [adminId, setAdminId] = useState(null);
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    const storedAdminId = sessionStorage.getItem("admin_id");
    const token = sessionStorage.getItem("jwtToken");

    if (!storedAdminId || !token) {
      toast.error("Admin session expired. Please log in.");
      router.push("/AdminLogin");
    } else {
      setAdminId(storedAdminId);
      setJwtToken(token);
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/adFetchIssue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          admin_id: adminId,
          issue_header: formData.issue_header,
          issue_detail: formData.issue_detail,
          status: formData.status,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create issue.");

      toast.success("Issue successfully sent to developer.");
      router.push("/AdminIssue");
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("Failed to send issue.");
    }
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <Toaster position="top-center" />

      <div className="flex justify-center text-red-600 mb-4">
        <FaExclamationCircle className="text-4xl" />
      </div>

      <h1 className="text-2xl font-bold text-center mb-6">Add New Issue</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Issue Header</label>
          <input
            type="text"
            name="issue_header"
            value={formData.issue_header}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Issue Detail</label>
          <textarea
            name="issue_detail"
            value={formData.issue_detail}
            onChange={handleChange}
            rows="4"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Status</label>
          <input
            type="text"
            value={formData.status}
            readOnly
            className="w-full p-2 bg-gray-100 text-red-600 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Send Issue to Developer
        </button>
      </form>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 w-screen bg-white border-t py-3">
        <div className="flex justify-around">
          <button
            onClick={() => router.push("/AdminMenu")}
            className={isActive("/AdminMenu") ? "text-red-500" : "text-gray-500"}
          >
            <FaHome className="text-2xl" />
          </button>
          <button
            onClick={() => router.push("/AdminCustomerComplaint")}
            className={isActive("/AdminCustomerComplaint") ? "text-red-500" : "text-gray-500"}
          >
            <FaExclamationTriangle className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddIssuePage;
