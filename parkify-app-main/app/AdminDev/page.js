'use client'
import React, { useEffect, useState } from "react";
import { FaUser, FaPen, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

const Developers = () => {
  const [developers, setDevelopers] = useState([]); // Ensure it's an empty array initially
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!sessionStorage.getItem("admin_id")) {
      toast.error("Admin ID not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchDevelopers = async () => {
      try {
        const response = await fetch("/api/adFetchDev"); // Call the API route
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Failed to fetch developers.");

        setDevelopers(result.developers || []); // Set developers to empty array if no data is returned
      } catch (error) {
        console.error("Error fetching developers:", error);
        toast.error("Failed to fetch developers.");
      }
    };

    fetchDevelopers();
  }, [router]);

  // Filter developers based on search query, ensure `developers` is an array
  const filteredDevelopers = developers.filter((developer) =>
    `${developer.email} ${developer.developer_id}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Handle navigation to edit page
  const handleEditClick = (developerId) => {
    sessionStorage.setItem("developer_id", developerId); // Store developer_id in sessionStorage
    router.push("/AdminDevEdit"); // Redirect to edit page without developer_id in the URL
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
          Developers
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by email or developer ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {/* Display Filtered Developers */}
        {filteredDevelopers.length > 0 ? (
          filteredDevelopers.map((developer) => (
            <div
              key={developer.developer_id}
              className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
            >
              <div className="flex items-center">
                <FaUser className="text-xl mr-3 text-black" />
                <div className="font-semibold text-black">
                  <div>{developer.email}</div>
                  <div className="text-sm text-gray-500">Developer ID: {developer.developer_id}</div>
                </div>
              </div>
              <button
                onClick={() => handleEditClick(developer.developer_id)}
                className="flex items-center text-black"
              >
                <FaPen className="text-xl mr-2" />
                Edit Info
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No developers found.</p>
        )}
      </div>
    </div>
  );
};

export default Developers;
