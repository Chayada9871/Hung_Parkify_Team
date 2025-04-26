"use client";

import React, { useEffect, useState } from "react";
import { FaCar, FaPen, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    if (!jwtToken) {
      toast.error("Authentication token not found. Please log in.");
      router.push("/AdminLogin");
      return;
    }

    const fetchCars = async () => {
      try {
        const response = await fetch("/api/adFetchCars", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || "Failed to fetch cars.");
        }

        const { cars: carData } = await response.json();
        setCars(carData);

      } catch (error) {
        console.error("Error fetching cars:", error.message);
        toast.error(`Failed to fetch cars: ${error.message}`);
      }
    };

    fetchCars();
  }, [router]);

  const filteredCars = cars.filter((car) =>
    car.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

 
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
          Cars
        </h1>

        <div className="relative mb-4">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-grey-100 rounded-full p-2">
            <FaSearch className="text-gray-500" />
          </button>

          <input
            type="text"
            placeholder="Search by License Plate"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 p-2 rounded-md border border-gray-300"
          />
        </div>

        {filteredCars.map((car) => (
          <div
            key={car.car_id}
            className="flex flex-col bg-gray-100 p-4 rounded-lg mb-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center mb-1">
                  <FaCar className="text-xl mr-3 text-black" />
                  <span className="font-semibold text-black">
                    {car.license_plate}
                  </span>
                </div>
                <p className="text-sm text-gray-700">Model: {car.car_model}</p>
                <p className="text-sm text-gray-700">Color: {car.car_color}</p>
                <p className="text-sm text-gray-700">User ID: {car.user_id}</p>
              </div>

            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Cars;
