"use client";

import React, { useEffect, useState } from "react";
import {
  FaSearch,
  FaClock,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaCar,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import BottomNav from "../components/BottomNav";

const formatThaiTime = (datetime) => {
  const options = { timeZone: "Asia/Bangkok", hour12: false };
  return new Date(datetime).toLocaleString("en-GB", options);
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      const token = sessionStorage.getItem("jwtToken");
      const userId = sessionStorage.getItem("userId");

      if (!token || !userId) {
        toast.error("Missing authentication data.");
        return;
      }

      try {
        const res = await fetch(`/api/renterFetchReservation?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error fetching data");

        setReservations(data.reservationDetails || []);
      } catch (err) {
        console.error("Error fetching reservations:", err.message);
        toast.error("Error loading reservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.location_name?.toLowerCase().includes(q) ||
      r.car_model?.toLowerCase().includes(q) ||
      formatThaiTime(r.start_time).toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster position="top-center" />
      <div className="relative flex-grow overflow-y-auto p-6">
        <button
          onClick={() => router.push("/home_renter")}
          className="absolute top-10 left-4 w-12 h-12 flex items-center justify-center border rounded-lg shadow-sm text-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
            fill="none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-black px-6 mt-16 py-4">My Reservations</h1>

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
            filteredReservations.map((r) => (
              <div key={r.reservation_id} className="p-4 bg-white rounded-lg shadow-md mb-4">
                <h2 className="text-lg font-semibold text-black">
                  <FaMapMarkerAlt className="inline-block mr-2" />
                  {r.location_name || "Unknown Location"}
                </h2>
                <p className="text-sm text-gray-500">Address: {r.location_address || "Unknown"}</p>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaClock className="mr-2" />
                  <span>{formatThaiTime(r.start_time)} - {formatThaiTime(r.end_time)}</span>
                </div>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaCar className="mr-2" />
                  <span>Car Model: {r.car_model || "Unknown"}</span>
                </div>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaMoneyBillWave className="mr-2" />
                  <span>Total Price: {Number(r.total_price || 0).toFixed(2)}฿</span>
                </div>
                <div className="flex items-center text-gray-700 mt-2">
                  <FaSearch className="mr-2" />
                  <span>Slot Number: {r.slot_number || "N/A"}</span>
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