"use client";

import React, { useEffect, useState } from "react";
import { FaUser, FaPen, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import supabase from "../../config/supabaseClient";
import { Toaster, toast } from "react-hot-toast";

const Lessors = () => {
  const [lessors, setLessors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();


  // Fetch lessors from Supabase
  useEffect(() => {

    if (!sessionStorage.getItem("admin_id")) {
        toast.error("Admin ID not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }
    const fetchLessors = async () => {
      try {
        const response = await fetch(`/api/adFetchLessor`);
        if (!response.ok) 
          {throw new Error("Failed to fetch lessor.", response.error);
         }
        else{
          const { lessorDetails } = await response.json();
          setLessors(lessorDetails);}
        } 
        catch (error) {
          console.error("Error fetching lessor:", error);
          toast.error("Failed to fetch lessor.");
          router.push("/AdminMenu"); }};

    fetchLessors();
  }, []);

  

  // Filter lessors based on search query
  const filteredLessors = lessors.filter((lessor) =>
    `${lessor.lessor_firstname} ${lessor.lessor_lastname}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Handle navigation to edit page
  const handleEditClick = (lessorId) => {
    sessionStorage.setItem("lessor_id", lessorId); // Store lessor_id in sessionStorage
    router.push("/AdminLessorEdit"); // Redirect to edit page without lessor_id in the URL
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
          Lessors
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {/* Display Filtered Lessors */}
        {filteredLessors.map((lessor) => (
          <div
            key={lessor.lessor_id}
            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <FaUser className="text-xl mr-3 text-black" />
              <span className="font-semibold text-black">
                {lessor.lessor_firstname} {lessor.lessor_lastname}
              </span>
            </div>
            <button
              onClick={() => handleEditClick(lessor.lessor_id)}
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

export default Lessors;
