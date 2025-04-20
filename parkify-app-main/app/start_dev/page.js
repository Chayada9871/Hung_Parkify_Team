"use client";

import React from "react";
import { useRouter } from "next/navigation"; // For Next.js 13+ with app directory

const StartPage = () => {
  const router = useRouter();

  const handleStart = () => {
    sessionStorage.clear(); // Clear all session
    router.push("/login_dev"); // Navigate to the login page
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <div className="text-center mb-8">
        <div className="rounded-full w-100 h-100 flex justify-center items-center">
          <img
            src="images/Brand.png"
            alt="Parking Icon"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <button
        className="bg-gray-800 text-white py-4 px-24 rounded-md text-lg hover:bg-gray-600 mb-36"
        onClick={handleStart}
      >
        Start
      </button>
    </div>
  );
};

export default StartPage;
