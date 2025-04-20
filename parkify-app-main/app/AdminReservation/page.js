"use client";

import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaPen, FaSearch, FaClock, FaMoneyBillWave, FaUserAlt, FaPhoneAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

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
    if (!sessionStorage.getItem("admin_id")) {
      toast.error("Admin ID not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }
    
    const fetchReservations = async () => {
      try {
        const response = await fetch(`/api/adFetchRes`);
        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }
        const { reservationDetails } = await response.json();
        setReservations(reservationDetails);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Failed to fetch reservations.");
      }
    };
  
    fetchReservations();
  }, [router]);
  

  // Filter reservations based on search query for User ID
  const filteredReservations = reservations.filter((reservation) => {
    const userIdMatch = reservation.user_id.toString().includes(searchQuery);
    const startTimeMatch = formatThaiTime(reservation.start_time).includes(searchQuery);
    return userIdMatch || startTimeMatch;
  });

  const handleEditClick = (reservationId) => {
    sessionStorage.setItem("reservation_id", reservationId);
    router.push("/AdminResEdit");
  };

  // Group reservations by start date
  const reservationsByDate = filteredReservations.reduce((grouped, reservation) => {
    const dateKey = formatThaiTime(reservation.start_time).split(",")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(reservation);
    return grouped;
  }, {});

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          Reservations
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by user ID or start date"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {Object.keys(reservationsByDate).length > 0 ? (
            Object.entries(reservationsByDate).map(([date, reservations]) => (
              <div key={date}>
                <div className="flex items-center mb-2">
                  <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
                    {date}
                  </span>
                </div>

                {reservations.map((reservation) => (
                  <div
                    key={reservation.reservation_id}
                    className="p-4 bg-white rounded-lg shadow-md mb-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-black">
                          Reservation ID: {reservation.reservation_id}
                        </h2>
                        <p className="text-sm text-gray-500">User ID: {reservation.user_id}</p>
                        <div className="flex items-center text-gray-700 mt-2">
                          <FaClock className="mr-2" />
                          <span>
                            {formatThaiTime(reservation.start_time)} - {formatThaiTime(reservation.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-700 mt-2">
                          <FaMoneyBillWave className="mr-2" />
                          <span>
                            Total Price: {reservation.total_price ? Number(reservation.total_price).toFixed(2) : "0.00"}฿
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditClick(reservation.reservation_id)}
                        className="flex items-center text-black"
                      >
                        <FaPen className="text-xl mr-2" />
                        Edit Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No reservations found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
