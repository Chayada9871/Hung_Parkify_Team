"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function LessorRegisterInformationPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const [lessorData, setLessorData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    lineUrl: "",
  });

  useEffect(() => {
  if (typeof window !== "undefined") {
    const storedEmail = sessionStorage.getItem("lessorEmail");
    const storedPassword = sessionStorage.getItem("lessorPassword");

    console.log("📦 Loaded from sessionStorage:", { storedEmail, storedPassword });

    if (!storedEmail || !storedPassword) {
      toast.error("Email and password are required. Redirecting to registration.");
      return;
    }
    
    setEmail(storedEmail);
    setPassword(storedPassword);

    
    setLessorData((prevData) => ({
      ...prevData,
      email: storedEmail,
      password: storedPassword,
    }));
  }
}, [router]);

const handleChange = (e) => {
  const { name, value } = e.target;
  setLessorData((prevData) => ({
    ...prevData,
    [name]: value,
  }));
  console.log("✍️ Field updated:", name, value);
};

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Submitting user data:", lessorData);

    if (!lessorData.firstName || !lessorData.lastName || !lessorData.phoneNumber || !lessorData.lineUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/lessorRegisPro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessorData),
      });

      const result = await response.json();
      console.log("📩 Response from server:", result);

      if (!response.ok) {
        toast.error(result.error || 'Registration failed');
        return;
      }

      setTimeout(() => {
        router.push('/login_lessor');
      }, 100); // 100ms delay
      
    } catch (error) {
      toast.error(error.message);
      console.error("❌ Registration error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />
      <div className="relative flex-grow overflow-y-auto p-6">
        <button
          onClick={() => router.push("/register_lessor")}
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
          Your Information for a <br /> Smooth Hosting Experience
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="w-11/12">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={lessorData.firstName}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-11/12">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={lessorData.lastName}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-11/12">
            <input
              type="number"
              name="phoneNumber"
              placeholder="Phone Number"
              value={lessorData.phoneNumber}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-11/12">
            <input
              type="text"
              name="lineUrl"
              placeholder="Line URL"
              value={lessorData.lineUrl}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-11/12">
            <label className="block text-sm font-medium text-gray-600 mb-1">Upload Profile Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="flex justify-center mb-4 w-4/5 mx-auto">
            <button type="submit" className="w-full bg-customBlue text-white py-3 rounded-lg hover:bg-blue-500">
              Register Lessor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
