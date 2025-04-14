"use client";

import React, { useEffect, useState } from "react";
import { FaUser, FaPen, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import supabase from "../../config/supabaseClient";
import { Toaster, toast } from "react-hot-toast";

const Renters = () => {
  const [renters, setRenters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch renters from the backend
  useEffect(() => {
    if (!sessionStorage.getItem("jwtToken")) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchRenters = async () => {
      try {
        const token = sessionStorage.getItem("jwtToken"); // Get the token from sessionStorage

        const response = await fetch(`/api/adFetchRenter`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Add token to Authorization header
          },
        });

        if (!response.ok) throw new Error("Failed to fetch renters");

        const { renterDetails } = await response.json();
        setRenters(renterDetails);
      } catch (error) {
        console.error("Error fetching renters:", error);
        toast.error("Failed to fetch renters.");
      }
    };

    fetchRenters();
  }, []);

  // Filter renters based on search query
  const filteredRenters = renters.filter((renter) =>
    `${renter.user_id} ${renter.first_name} ${renter.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Handle navigation to edit page
  const handleEditClick = (userId) => {
    sessionStorage.setItem("user_id", userId); // Store user_id in sessionStorage
    router.push("/AdminRenterEdit"); // Redirect to edit page without user_id in the URL
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
          Renters
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4 ">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by id or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {/* Display Filtered Renters */}
        {filteredRenters.map((renter) => (
          <div
            key={renter.user_id}
            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <FaUser className="text-xl mr-3 text-black" />
              <span className="font-semibold text-black">
                {renter.first_name} {renter.last_name}
              </span>
            </div>
            <button
              onClick={() => handleEditClick(renter.user_id)}
              className="flex items-center text-black"
            >
              <FaPen className="text-xl mr-2" />
              Edit Info
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Renters;
