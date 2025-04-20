"use client";
import React, { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RegisterInformationPage() {
  const router = useRouter();
  const fileUploadRef = useRef(null); // Ref to capture file input

  // State for lessorId and lessorData
  const [lessorId, setLessorId] = useState(null);
  const [lessorData, setLessorData] = useState({
    locationName: "",
    address: "",
    locationUrl: "",
    totalSlots: "",
    pricePerHour: "",
  });

  // Get lessorId from sessionStorage on the client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLessorId = sessionStorage.getItem("lessorId");
      setLessorId(storedLessorId);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLessorData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields are filled
    if (
      !lessorData.locationName ||
      !lessorData.address ||
      !lessorData.locationUrl ||
      !lessorData.totalSlots ||
      !lessorData.pricePerHour
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate that a file has been uploaded
    const file = fileUploadRef.current?.files[0];
    if (!file) {
      toast.error("Please upload a location image.");
      return;
    }

    try {
      // Create FormData and append all fields and file
      const formData = new FormData();
      formData.append("lessorId", lessorId);
      formData.append("locationName", lessorData.locationName);
      formData.append("address", lessorData.address);
      formData.append("locationUrl", lessorData.locationUrl);
      formData.append("totalSlots", lessorData.totalSlots);
      formData.append("pricePerHour", lessorData.pricePerHour);
      formData.append("locationImage", file); // Add file for image upload

      // Make the API call
      const response = await fetch("/api/regisParkInfo", {
        method: "POST",
        body: formData, // Send as form data
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "An error occurred during registration"
        );
      }

      toast.success("Lessor registration successful!");
      router.push("/home_lessor"); // Redirect after success
    } catch (error) {
      toast.error(
        error.message || "An unexpected error occurred. Please try again later."
      );
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />

      {/* Cross Button */}
      {/* Cross Button */}
      <button
        onClick={() => {
          console.log("Navigating to home_lessor");
          router.push("/home_lessor");
        }}
        className="absolute top-5 right-5 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-700 shadow-md focus:outline-none z-50" // Added z-50 to ensure it's on top
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="relative flex-grow overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          Parking Registration
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 flex flex-col items-center"
        >
          <div className="w-11/12">
            <input
              type="text"
              name="locationName"
              placeholder="Parking Name"
              value={lessorData.locationName}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ textTransform: "capitalize" }}
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={lessorData.address}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="locationUrl"
              placeholder="Location URL"
              value={lessorData.locationUrl}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="number"
              name="totalSlots"
              placeholder="Total Slots"
              value={lessorData.totalSlots}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="number"
              name="pricePerHour"
              placeholder="Price per Hour"
              value={lessorData.pricePerHour}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <h2 className="text-gray-600 font-semibold mb-2">Location Image</h2>
            <input
              type="file"
              ref={fileUploadRef}
              accept="image/*"
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex justify-center mb-4 w-4/5 mx-auto">
            <button
              type="submit"
              className="w-full bg-customBlue text-white py-3 rounded-lg hover:bg-blue-100"
            >
              Add Parking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
