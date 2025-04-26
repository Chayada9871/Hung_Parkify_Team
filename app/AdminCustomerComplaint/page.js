"use client";

import React, { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaPen,
  FaSearch,
  FaHome,
  FaPlus,
} from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

const CustomerComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const handleNavigate = (path) => {
    router.push(path);
  };

  // Fetch complaints with token
  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");
    const jwtToken = sessionStorage.getItem("jwtToken");

    if (!adminId || !jwtToken) {
      toast.error("Authentication required. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchComplaints = async () => {
      try {
        const response = await fetch("/api/adFetchComplaint", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // 🔐 Send token
          },
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || "Failed to fetch complaints");
          return;
        }

        if (!result.complaints || result.complaints.length === 0) {
          toast("No complaints available.");
        } else {
          setComplaints(result.complaints);
          console.log("Fetched complaints successfully:", result.complaints);
        }
      } catch (error) {
        console.error("Error fetching complaints:", error.message);
        toast.error("An unexpected error occurred. Please try again.");
      }
    };

    fetchComplaints();
  }, [router]);

  const filteredComplaints = complaints.filter((complaint) =>
    `${complaint.complain} ${complaint.submitter_id}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleEditClick = (complainId) => {
    sessionStorage.setItem("complain_id", complainId);
    router.push("/AdminComplaintEdit");
  };

  return (
    <div className="flex flex-col h-screen bg-white p-6">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="flex-grow overflow-y-auto p-6">
        <h1 className="text-3xl font-bold text-black text-left w-full mt-10 py-4">
          Customer Support 🔧
        </h1>

        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>
          <input
            type="text"
            placeholder="Search by complaint or submitter ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {filteredComplaints.map((complaint) => (
          <div
            key={complaint.complain_id}
            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <FaExclamationTriangle className="text-xl mr-3 text-black" />
              <div className="font-semibold text-black">
                <div>{complaint.complain}</div>
                <div className="text-sm text-gray-500">
                  Submitter ID: {complaint.submitter_id}
                </div>
                <div className="text-sm text-gray-500">
                  User Type: {complaint.user_type}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleEditClick(complaint.complain_id)}
              className="flex items-center text-black"
            >
              <FaPen className="text-xl mr-2" />
              Edit Info
            </button>
          </div>
        ))}
      </div>

      {/* Add Issue Button */}
      <button
        onClick={() => handleNavigate("/AdminAddIssue")}
        className="fixed bottom-20 right-6 bg-blue-500 text-white p-4 rounded-full shadow-md flex items-center space-x-2 justify-center"
      >
        <FaPlus className="text-xxl" />
        <span className="text-md font-semibold">Add New Issue for Developer</span>
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 w-screen bg-white border-t border-gray-300 py-3">
        <div className="flex justify-around items-center">
          <button
            onClick={() => handleNavigate("/AdminMenu")}
            className={
              isActive("/AdminMenu") || isActive("/AdminAddIssue")
                ? "text-red-500"
                : "text-gray-500"
            }
          >
            <FaHome className="text-2xl" />
          </button>
          <button
            onClick={() => handleNavigate("/AdminCustomerComplaint")}
            className={
              isActive("/AdminCustomerComplaint")
                ? "text-red-500"
                : "text-gray-500"
            }
          >
            <FaExclamationTriangle className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerComplaints;
