"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lockoutTime, setLockoutTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Clear session storage and manage lockout timer on page load
  useEffect(() => {
    sessionStorage.removeItem("developer_id");
    sessionStorage.removeItem("developer_email");

    const lockoutTimestamp = localStorage.getItem("lockout_timestamp");
    if (lockoutTimestamp) {
      const now = new Date().getTime();
      const timeLeft = Math.ceil((lockoutTimestamp - now) / 1000);
      if (timeLeft > 0) {
        setLockoutTime(lockoutTimestamp);
        setTimeRemaining(timeLeft);
      } else {
        localStorage.removeItem("lockout_timestamp");
      }
    }
  }, []);

  // Countdown timer effect for lockout
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = Math.ceil((lockoutTime - now) / 1000);
        if (timeLeft <= 0) {
          clearInterval(interval);
          setLockoutTime(null);
          setTimeRemaining(0);
          localStorage.removeItem("lockout_timestamp");
          localStorage.setItem("failed_attempts", 0); // Reset failed attempts
        } else {
          setTimeRemaining(timeLeft);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (lockoutTime) {
      toast.error(`Please wait ${timeRemaining} seconds before trying again.`);
      return;
    }

    try {
      const response = await fetch("/api/devLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleFailedLoginAttempt();
        } else {
          toast.error("An error occurred. Please try again.");
        }
        return;
      }

      const data = await response.json();

      // Store developer ID and email in session storage
      sessionStorage.setItem("developer_id", data.developer_id);
      sessionStorage.setItem("developer_email", email);

      // Reset failed attempts and redirect
      localStorage.setItem("failed_attempts", 0);
      toast.success("Login successful!");
      router.push("/home_dev");
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleFailedLoginAttempt = () => {
    let failedAttempts = parseInt(localStorage.getItem("failed_attempts")) || 0;
    failedAttempts += 1;
    localStorage.setItem("failed_attempts", failedAttempts);

    if (failedAttempts >= 3) {
      const lockoutDuration = 30 * 1000; // 30 seconds lockout
      const lockoutTimestamp = new Date().getTime() + lockoutDuration;
      localStorage.setItem("lockout_timestamp", lockoutTimestamp);
      setLockoutTime(lockoutTimestamp);
      setTimeRemaining(30);
      toast.error("Too many failed attempts. Please try again in 30 seconds.");
    } else {
      toast.error("Incorrect email or password. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Back Button */}
      <button
        onClick={() => router.push("/landing")}
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

      <div className="text-center mb-8 mt-10">
        <div className="rounded-full w-80 h-80 flex justify-center items-center">
          <img
            src="/images/Brand.png"
            alt="Parking Icon"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
            disabled={!!lockoutTime}
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
            disabled={!!lockoutTime}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-800 text-white py-3 rounded-md text-lg hover:bg-gray-600"
          disabled={!!lockoutTime}
        >
          {lockoutTime ? `Please wait ${timeRemaining} seconds` : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
