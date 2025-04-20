"use client";

import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaSearch, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaCar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import BottomNav from "../components/BottomNav";

// Utility function to convert UTC time to Thai time (UTC+7)
const formatThaiTime = (datetime) => {
  const options = { timeZone: "Asia/Bangkok", hour12: false };
  return new Date(datetime).toLocaleString("en-GB", options); // Using en-GB for 24-hour format
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in.");
      router.push("/login_renter");
      return;
    }

    const fetchReservations = async () => {
      try {
        const response = await fetch(`/api/renterFetchReservation?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }
        const { reservationDetails } = await response.json();

        // Sort reservations by start_time (newest to oldest)
        const sortedReservations = reservationDetails.sort(
          (a, b) => new Date(b.start_time) - new Date(a.start_time)
        );

        setReservations(sortedReservations);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Failed to fetch reservations.");
      }
    };

    fetchReservations();
  }, [router]);

  // Filter reservations based on search query
  const filteredReservations = reservations.filter((reservation) => {
    const locationMatch = reservation.location_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const carModelMatch = reservation.car_model
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const startTimeMatch = formatThaiTime(reservation.start_time)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return locationMatch || carModelMatch || startTimeMatch;
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="relative flex-grow overflow-y-auto p-6">
        <button
          onClick={() => router.push("/home_renter")}
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

        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          My Reservations
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>
          <input
            type="text"
            placeholder="Search by location or car model"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation) => (
              <div
                key={reservation.reservation_id}
                className="p-4 bg-white rounded-lg shadow-md mb-4"
              >
                <h2 className="text-lg font-semibold text-black">
                  <FaMapMarkerAlt className="inline-block mr-2" />
                  {reservation.location_name || "Unknown Location"}
                </h2>
                <p className="text-sm text-gray-500">
                  Address: {reservation.location_address || "Unknown Address"}
                </p>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaClock className="mr-2" />
                  <span>
                    {formatThaiTime(reservation.start_time)} - {formatThaiTime(reservation.end_time)}
                  </span>
                </div>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaCar className="mr-2" />
                  <span>Car Model: {reservation.car_model || "Unknown"}</span>
                </div>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaMoneyBillWave className="mr-2" />
                  <span>
                    Total Price: {reservation.total_price ? Number(reservation.total_price).toFixed(2) : "0.00"}฿
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <h2 className="text-xl text-gray-500 font-semibold">No reservations available</h2>
              <p className="text-sm text-gray-400">Please make a reservation to see it here.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Reservations;
