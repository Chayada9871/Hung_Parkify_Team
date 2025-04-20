"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

const AdminLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(null);

  // Manage lockout logic
  useEffect(() => {
    const lockoutEnd = localStorage.getItem("lockoutEnd");
    if (lockoutEnd) {
      const timeLeft = parseInt(lockoutEnd) - Date.now();
      if (timeLeft > 0) {
        setLockoutTimeLeft(timeLeft);
      } else {
        localStorage.removeItem("lockoutEnd");
        localStorage.setItem("failedAttempts", 0);
      }
    }

    const timer = setInterval(() => {
      const lockoutEnd = localStorage.getItem("lockoutEnd");
      if (lockoutEnd) {
        const timeLeft = parseInt(lockoutEnd) - Date.now();
        if (timeLeft <= 0) {
          clearInterval(timer);
          localStorage.removeItem("lockoutEnd");
          localStorage.setItem("failedAttempts", 0);
          setLockoutTimeLeft(null);
        } else {
          setLockoutTimeLeft(timeLeft);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle login process
  const handleLogin = async () => {
    if (lockoutTimeLeft) return;

    try {
      const response = await fetch("/api/adLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Invalid email or password.");
        toast.error(result.error || "Invalid email or password.");

        // Increment failed attempts counter
        const failedAttempts = parseInt(localStorage.getItem("failedAttempts")) || 0;
        const newFailedAttempts = failedAttempts + 1;
        localStorage.setItem("failedAttempts", newFailedAttempts);

        // Lockout after 3 failed attempts
        if (newFailedAttempts >= 3) {
          const lockoutDuration = 30 * 1000; // 30 seconds
          const lockoutEnd = Date.now() + lockoutDuration;
          localStorage.setItem("lockoutEnd", lockoutEnd);
          setLockoutTimeLeft(lockoutDuration);
          toast.error("Too many failed attempts. Try again in 30 seconds.");
        }
      } else {
        // Successful login
        setErrorMessage("");
        localStorage.removeItem("failedAttempts");
        localStorage.removeItem("lockoutEnd");
        sessionStorage.setItem("jwtToken", result.token); // Save JWT token
        sessionStorage.setItem("admin_id", result.admin_id); // Save admin_id
        toast.success("Login successful!");
        router.push("/AdminMenu");
      }
    } catch (err) {
      console.error("Error during login:", err);
      setErrorMessage("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
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

      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-80 text-center">
        <img src="admin-logo.png" alt="Parkify Logo" className="mx-auto mb-2 w-50 h-50" />

        <div className="mt-8">
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-700"
              disabled={lockoutTimeLeft}
            />
          </div>

          <div className="mb-6 relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-700"
              disabled={lockoutTimeLeft}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

          <button
            onClick={handleLogin}
            className={`w-full ${lockoutTimeLeft ? "bg-gray-400" : "bg-gray-900"
              } text-white py-3 rounded-lg font-semibold mb-14`}
            disabled={lockoutTimeLeft}
          >
            {lockoutTimeLeft
              ? `Try again in ${Math.ceil(lockoutTimeLeft / 1000)}s`
              : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
