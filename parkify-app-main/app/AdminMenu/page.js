"use client";

import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaUser,
  FaParking,
  FaFileAlt,
  FaCar,
  FaBell,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaCode,
} from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const AdminMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const text = "Welcome, Admin! Let’s drive Parkify’s growth together!";
  const [displayText, setDisplayText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typingSpeed = 100; // Speed of typing
  const deletingSpeed = 50; // Speed of deleting
  const stopDeleteAtIndex = 1; // Stop deleting at the first letter "W"

  useEffect(() => {

    if (!sessionStorage.getItem("admin_id")) {
        toast.error("Admin ID not found. Please log in.");
        router.push("/AdminLogin");
        return;
      }
    const handleTyping = () => {
      if (!isDeleting && typingIndex < text.length) {
        setDisplayText((prev) => prev + text[typingIndex]);
        setTypingIndex((prev) => prev + 1);
      } else if (isDeleting && typingIndex > stopDeleteAtIndex) {
        setDisplayText((prev) => prev.slice(0, -1));
        setTypingIndex((prev) => prev - 1);
      } else if (typingIndex === text.length) {
        setIsDeleting(true);
      } else if (typingIndex === stopDeleteAtIndex && isDeleting) {
        setIsDeleting(false);
      }
    };

    const typingTimer = setTimeout(
      handleTyping,
      isDeleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(typingTimer);
  }, [typingIndex, isDeleting]);

  useEffect(() => {
    const adminId = sessionStorage.getItem("admin_id");
    if (!adminId) {
      toast.error("Admin ID not found");
      router.push("/AdminLogin");
      return;
    }
  }, [router]);

  // Function to navigate to the specified page
  const handleNavigate = (path) => {
    router.push(path);
  };

  // Check if the current path matches a specific route
  const isActive = (path) => pathname === path;

  // Function to handle logout
  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/AdminLogin");
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <Toaster />

      {/* Header with fixed-height container for text */}
      <div className="flex justify-between items-center mb-8">
        <h1
          className="text-2xl font-bold text-customBlue mt-5"
          style={{ minHeight: "4rem" }}
        >
          {displayText}
        </h1>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 gap-6 mb-16">
        {/* Renter Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminRenter")}
        >
          <FaUser className="text-4xl mb-2" />
          <span className="font-semibold">Renter</span>
        </div>

        {/* Parking Lot Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminParking")}
        >
          <FaParking className="text-4xl mb-2" />
          <span className="font-semibold">Parking Lot</span>
        </div>

        {/* Lessor Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminLessor")}
        >
          <FaFileAlt className="text-4xl mb-2" />
          <span className="font-semibold">Lessor</span>
        </div>

        {/* Car Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminCar")}
        >
          <FaCar className="text-4xl mb-2" />
          <span className="font-semibold">Car</span>
        </div>

        {/* Reservation Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminReservation")}
        >
          <FaBell className="text-4xl mb-2" />
          <span className="font-semibold">Reservation</span>
        </div>

        {/* Issue Report Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer"
          onClick={() => handleNavigate("/AdminIssue")}
        >
          <FaExclamationTriangle className="text-4xl mb-2" />
          <span className="font-semibold">Issue Report</span>
        </div>

        {/* Developer Card */}
        <div
          className="bg-gray-100 p-6 rounded-lg flex flex-col items-center cursor-pointer col-span-2 w-2/4 mx-auto"
          onClick={() => handleNavigate("/AdminDev")}
        >
          <FaCode className="text-4xl mb-2" />
          <span className="font-semibold">Developer</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed bottom-16 right-6 flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-md"
      >
        <FaSignOutAlt className="text-xl" />
        <span className="font-semibold">Logout</span>
      </button>

      <div className="fixed bottom-0 w-full bg-white border-t border-gray-300 py-3">

{/* Bottom Navigation */}
<div className="fixed bottom-0 left-0 right-0 w-screen bg-white border-t border-gray-300 py-3">
  <div className="flex justify-around items-center">
    {/* Home Button - Red when in /AdminMenu or /AdminAddIssue */}
    <button
      onClick={() => handleNavigate("/AdminMenu")}
      className={(isActive("/AdminMenu") || isActive("/AdminAddIssue")) ? "text-red-500" : "text-gray-500"}
    >
      <FaHome className="text-2xl" />
    </button>

    {/* Customer Complaint Button */}
    <button
      onClick={() => handleNavigate("/AdminCustomerComplaint")}
      className={isActive("/CustomerComplaint") ? "text-red-500" : "text-gray-500"}
    >
      <FaExclamationTriangle className="text-2xl" />
    </button>

  </div>
</div>

</div>

    </div>
  );
};

export default AdminMenu;
