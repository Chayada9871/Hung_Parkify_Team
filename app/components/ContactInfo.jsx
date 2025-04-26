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
      {/* Profile picture is optional, if you later add it */}
      {/* <img
        src={lessorDetails.profilePic || "/user_icon.png"}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/user_icon.png";
        }}
        alt="Contact"
        className="w-20 h-20 rounded-full object-cover shadow-md"
      /> */}

      <div className="text-left">
        <h3 className="text-xl font-semibold text-black">
          {lessorDetails.lessor_firstname} {lessorDetails.lessor_lastname}
        </h3>

        <p className="text-gray-500 text-sm flex items-center mt-2">
          <img src="/telephone.png" alt="Phone Icon" className="w-4 h-4 mr-2" />
          {lessorDetails.lessor_phone}
        </p>

        <p className="text-gray-500 text-sm flex items-center mt-2">
          <img src="/gmail.png" alt="Email Icon" className="w-4 h-4 mr-2" />
          {lessorDetails.lessor_email}
        </p>
      </div>
    </div>
  );
};

export default ContactInfo;
