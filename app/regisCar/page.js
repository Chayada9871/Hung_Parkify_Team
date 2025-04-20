'use client';
import React, { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import supabase from '../../config/supabaseClient';
import FileUpload from '../../config/fileUpload';
import { v4 as uuidv4 } from 'uuid';

export default function RegisterInformationPage() {
  const router = useRouter();
  const userId = sessionStorage.getItem('userId');
  const fileUploadRef = useRef(null);

  const [carData, setCarData] = useState({
    carModel: '',
    carColor: '',
    licensePlateNumber: '',
  });

  const [fileURL, setFileURL] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCarData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!carData.carModel || !carData.licensePlateNumber || !carData.carColor) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!fileURL && fileUploadRef.current) {
      try {
        await fileUploadRef.current.handleUpload();
      } catch (error) {
        return; // Stop submission if file upload fails
      }
    }

    if (!fileURL) {
      toast.error('Please upload an image');
      return;
    }

    try {
      const response = await fetch('/api/registerCar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          carModel: carData.carModel,
          carColor: carData.carColor,
          licensePlateNumber: carData.licensePlateNumber,
          fileURL,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An error occurred while registering the car.');
      }

      toast.success(result.message || 'Car registration successful!');
      router.push('/home_renter');
    } catch (error) {
      toast.error(error.message);
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-white">
      <Toaster />

      {/* Cross Icon */}
      <button
        onClick={() => router.push('/home_renter')}
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-700 shadow-md focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex-grow overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-4">
          Car Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="w-11/12">
            <input
              type="text"
              name="carModel"
              placeholder="Car Model"
              value={carData.carModel}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="carColor"
              placeholder="Car Color"
              value={carData.carColor}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="licensePlateNumber"
              placeholder="License Plate Number"
              value={carData.licensePlateNumber}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <h2 className="text-gray-600 font-semibold mb-2">Car Image</h2>
            <FileUpload
              ref={fileUploadRef}
              storageBucket="car_image"
              fileName={`${uuidv4()}.jpg`}
              setFileURL={setFileURL}
            />
          </div>

          <div className="flex justify-center mb-4 w-4/5 mx-auto">
            <button type="submit" className="w-full bg-customBlue text-white py-3 rounded-lg hover:bg-blue-100">
              Register Car
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
