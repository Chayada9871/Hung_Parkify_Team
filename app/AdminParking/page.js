"use client";

import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaPen, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

const ParkingLots = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch parking lots using JWT token
  useEffect(() => {
    const jwtToken = sessionStorage.getItem("jwtToken");
    if (!jwtToken) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchParkingLots = async () => {
      try {
        const response = await fetch(`/api/adFetchPark`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Add token to Authorization header
          },
        });

        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(`Failed to fetch parking lots: ${errorDetails.error}`);
        }

        const { parkingLotDetails } = await response.json();
        setParkingLots(parkingLotDetails);
        
      } catch (error) {
        console.error("Error fetching parking lots:", error.message);
        toast.error(`Failed to fetch parking lots: ${error.message}`);
      }
    };

    fetchParkingLots();
  }, [router]);

  // Filter parking lots based on search query
  const filteredParkingLots = parkingLots.filter((lot) =>
    `${lot.location_name} ${lot.address}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Handle navigation to edit page
  const handleEditClick = (lotId) => {
    sessionStorage.setItem("parking_lot_id", lotId); // Store parking_lot_id in sessionStorage
    router.push("/AdminParkingEdit"); // Redirect to edit page without parking_lot_id in the URL
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
          Parking Lots
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by location or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {/* Display Filtered Parking Lots */}
        {filteredParkingLots.map((lot) => (
          <div
            key={lot.parking_lot_id}
            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-4"
          >
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-xl mr-3 text-black" />
              <div className="font-semibold text-black">
                <div>{lot.location_name}</div>
                <div className="text-sm text-gray-500">{lot.address}</div>
              </div>
            </div>
            <button
              onClick={() => handleEditClick(lot.parking_lot_id)}
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

export default ParkingLots;
