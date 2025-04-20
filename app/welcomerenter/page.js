'use client';
import React from 'react';
import LoginButton from '../components/LoginButton';
import RegisterButton from '../components/RegisterButton';
import { useRouter } from 'next/navigation'; // Import the useRouter hook

const WelcomePage = () => {
  const router = useRouter(); // Initialize the router

  // Function to handle the Register button click
  const handleRegisterClick = () => {
    router.push('/register_renter'); // Navigate to the register page
  };

  // Function to handle the Login button click
  const handleLoginClick = () => {
    router.push('/login_renter'); // Navigate to the login page
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 relative">
      {/* Back button */}
      <button
        onClick={() => router.push('/landing')}
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

      {/* Main content */}
      <img src="logo.png" alt="Parkify Logo" className="w-64 mb-6" />
      <LoginButton onClick={handleLoginClick} />
      <RegisterButton variant="white" onClick={handleRegisterClick} />
    </div>
  );
};

export default WelcomePage;
