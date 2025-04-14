'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineLogout, AiOutlineUser, AiOutlineCar, AiOutlineCustomerService } from 'react-icons/ai';
import toast, { Toaster } from 'react-hot-toast';
import BottomNav from '../components/BottomNavLessor';
import BackButton from '../components/BackButton';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for sessionStorage only on the client side
    const storedLessorId = sessionStorage.getItem('lessorId');
  
    if (!storedLessorId) {
      toast.error("Lessor ID not found");
      router.push('/login_lessor'); // Redirect if no lessorId is found
    }
  }, []);

  const handleLogout = () => {
    toast((t) => (
      <div>
        <p>Are you sure you want to log out?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              sessionStorage.clear();
              router.push('/landing'); // Navigate to landing page
            }}
            className="mr-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Yes, Log Out
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  

  return (
    <div className="flex flex-col h-screen bg-white p-6">
      <Toaster />
      <div className="relative flex-grow overflow-y-auto p-6">

        {/* Back Button */}
        <BackButton targetPage="/home_lessor" />

        {/* Heading */}
        <h1 className="text-2xl font-bold text-black text-left w-full px-2 mt-5 py-4">
          Settings
        </h1>

        {/* My Profile Section */}
        <div
          onClick={() => router.push('/editLessorProfile')}
          className="flex justify-between items-center p-4 bg-gray-100 rounded-lg cursor-pointer shadow mt-5"
        >
          <span className="text-lg flex items-center">
            <AiOutlineUser className="mr-2 text-gray-700" /> My Profile
          </span>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* My Parking Lots Section */}
        <div
          onClick={() => router.push('/editPark')}
          className="flex justify-between items-center p-4 bg-gray-100 rounded-lg cursor-pointer shadow mt-5"
        >
          <span className="text-lg flex items-center">
            <AiOutlineCar className="mr-2 text-gray-700" /> My Parking Lots
          </span>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Customer Support Section */}
        <div
          onClick={() => router.push('/lessorCustomerSupport')}
          className="flex justify-between items-center p-4 bg-gray-100 rounded-lg cursor-pointer shadow mt-5"
        >
          <span className="text-lg flex items-center">
            <AiOutlineCustomerService className="mr-2 text-gray-700" /> Customer Support
          </span>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Logout Button */}
        <div
          onClick={handleLogout}
          className="flex justify-end items-center mt-5 cursor-pointer"
        >
          <button className="flex items-center bg-red-500 text-white px-4 py-2 rounded-xl shadow hover:bg-red-600 transition duration-200">
            <AiOutlineLogout className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
