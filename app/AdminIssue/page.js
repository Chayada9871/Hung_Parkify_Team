"use client";

import React, { useEffect, useState } from "react";
import { FaExclamationTriangle, FaPen, FaSearch, FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import supabase from "../../config/supabaseClient";
import { Toaster, toast } from "react-hot-toast";

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch issues from Supabase
  useEffect(() => {
    const fetchIssue = async () => {
      if (!sessionStorage.getItem("admin_id")) {
        toast.error("Admin ID not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }
      try {
        const { data, error } = await supabase.rpc("get_all_issues");

        if (error) throw error;

        setIssues(data);
      } catch (error) {
        console.error("Error fetching issues:", error);
        toast.error("Failed to fetch issues.");
        router.push("/AdminLogin");
      }
    };

    fetchIssue();
  }, [router]);

  // Filter and sort issues
  const filteredIssues = issues
    .filter((issue) =>
      issue.issue_header.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const statusOrder = ["Not Started", "In Progress", "Done"];
      return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });

  // Handle navigation to edit page
  const handleEditClick = (issueId) => {
    sessionStorage.setItem("issue_id", issueId); // Store issue_id in sessionStorage
    router.push("/AdminIssueEdit"); // Redirect to edit page without issue_id in the URL
  };

  // Handle navigation to add issue page
  const handleAddIssueClick = () => {
    router.push("/AdminAddIssue"); // Redirect to add issue page
  };

  // Function to get the color for the status text
  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "text-red-500";
      case "In Progress":
        return "text-blue-500";
      case "Done":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="relative flex-grow overflow-y-auto p-6">
        <button
          onClick={() => router.push("/AdminMenu")}
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

        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          Issues
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by Issue Header"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {/* Display Filtered and Sorted Issues */}
        {filteredIssues.map((issue) => (
          <div
            key={issue.issue_id}
            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <FaExclamationTriangle className="text-xl mr-3 text-black" />
              <div className="font-semibold text-black">
                <div>{issue.issue_header}</div>
                <div className="text-sm text-gray-500">
                  Details: {issue.issue_detail}
                </div>
                <div
                  className={`text-sm font-semibold ${getStatusColor(
                    issue.status
                  )}`}
                >
                  Status: {issue.status}
                </div>
                <div className="text-sm text-gray-500">
                  Resolved By: {issue.resolved_by || "N/A"}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleEditClick(issue.issue_id)}
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
        onClick={handleAddIssueClick}
        className="fixed bottom-16 right-6 bg-blue-500 text-white px-6 py-3 rounded-full flex items-center space-x-2 shadow-lg"
      >
        <FaPlus className="text-lg" />
        <span>Add Issue</span>
      </button>
    </div>
  );
};

export default Issues;
