"use client";
import React from "react";

const ContactInfo = ({ lessorDetails }) => {
  if (!lessorDetails) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg shadow-md">
        <p className="text-gray-500">Loading contact information...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md flex items-center space-x-4">
      <img
        src={lessorDetails?.profilePic || "user_icon.png"} // Use provided or default image
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop
          e.target.src = "user_icon.png"; // Fallback to default image
        }}
        alt="Contact"
        className="w-20 h-20 rounded-full object-cover shadow-md"
      />
      <div className="text-left">
        <h3 className="text-xl font-semibold text-black">
          {lessorDetails.name}
        </h3>
        <p className="text-gray-500 text-sm flex items-center">
          <img src="telephone.png" alt="Phone Icon" className="w-3 h-3 mr-2" />
          {lessorDetails.phone}
        </p>

        <p className="text-gray-500 text-sm flex items-center">
          <img src="gmail.png" alt="Phone Icon" className="w-3.5 h-3.5 mr-2" />
          {lessorDetails.email}
        </p>
      </div>
    </div>
  );
};

export default ContactInfo;
