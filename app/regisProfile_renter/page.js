"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RegisterInformationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userData, setUserData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("userEmail") || "";
      const storedPassword = sessionStorage.getItem("userPassword") || "";

      console.log("📦 Loaded from sessionStorage:", { storedEmail, storedPassword });

      if (!storedEmail || !storedPassword) {
        toast.error("Email and password are required. Redirecting to registration.");
        router.push("/register_renter");
        return;
      }

      setEmail(storedEmail);
      setPassword(storedPassword);

      setUserData((prevData) => ({
        ...prevData,
        email: storedEmail,
        password: storedPassword,
      }));
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    console.log("✍️ Field updated:", name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Submitting user data:", userData);

    if (
      !userData.email ||
      !userData.password ||
      !userData.firstName ||
      !userData.lastName ||
      !userData.phoneNumber
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/renterRegisterPro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("📩 Response from server:", result);

      if (!response.ok) {
        toast.error(result.error || 'Registration failed');
        return;
      }

     
      setTimeout(() => {
        router.push('/login_renter');
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
          onClick={() => router.push("/register_renter")}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          Your Information for a <br /> Smooth Reservation Experience
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 flex flex-col items-center"
        >
          <div className="w-11/12">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={userData.firstName}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={userData.lastName}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="number"
              name="phoneNumber"
              placeholder="Phone Number"
              value={userData.phoneNumber}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div className="flex justify-center mb-4 w-4/5 mx-auto">
            <button
              type="submit"
              className="w-full bg-customBlue text-white py-3 rounded-lg hover:bg-blue-100"
            >
              Get started
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
