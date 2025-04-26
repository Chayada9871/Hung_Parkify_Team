'use client';

import React, { useState, useRef, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Crypto from 'crypto-js';
import FileUpload from '../../config/fileUpload';
import { v4 as uuidv4 } from 'uuid';

export default function RegisterInformationPage() {
  const router = useRouter();
  const fileUploadRef = useRef(null);

  const [carData, setCarData] = useState({
    carModel: '',
    carColor: '',
    licensePlateNumber: '',
  });

  const [fileURL, setFileURL] = useState('');

  // 🔐 Fetch and store keys after mount
  useEffect(() => {
    const fetchAndStoreKeys = async () => {
      console.log('🕵️ useEffect triggered (checking for jwtToken)...');
      const token = sessionStorage.getItem('jwtToken');
  
      try {
        const res = await fetch('/api/getUserKeys', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const data = await res.json();
        console.log('🔑 Key Fetch Result:', data);
  
        if (!res.ok) throw new Error(data.error || 'Fetch failed');
  
        const { privateKey, sessionKey } = data;
        if (!privateKey || !sessionKey) {
          throw new Error('Keys missing from response');
        }
  
        localStorage.setItem('userPrivateKey', privateKey); // unused here
        localStorage.setItem('userAESKey', sessionKey);
        console.log('✅ Keys saved to localStorage');
      } catch (error) {
        toast.error('Failed to retrieve user keys');
        console.error('❌ Key Fetch Error:', error);
      }
    };

    fetchAndStoreKeys();
  }, []);

  // ✅ AES encryption using crypto-js
  const encryptData = (text, aesKeyHex) => {
    const key = Crypto.enc.Hex.parse(aesKeyHex);
    const iv = Crypto.lib.WordArray.random(16);
    const encrypted = Crypto.AES.encrypt(text, key, {
      iv: iv,
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.Pkcs7,
    });

    return `${Crypto.enc.Base64.stringify(iv)}:${encrypted.toString()}`;
  };

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
      } catch {
        return;
      }
    }

    if (!fileURL) {
      toast.error('Please upload an image');
      return;
    }

    const token = sessionStorage.getItem('jwtToken');
    const sessionKey = localStorage.getItem('userAESKey');

    if (!token || !sessionKey) {
      toast.error('Missing authentication or encryption keys');
      return;
    }

    try {
      const encryptedModel = encryptData(carData.carModel, sessionKey);
      const encryptedColor = encryptData(carData.carColor, sessionKey);
      const encryptedPlate = encryptData(carData.licensePlateNumber, sessionKey);

      const response = await fetch('/api/registerCar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          car_model: encryptedModel,
          car_color: encryptedColor,
          license_plate: encryptedPlate,
          carimage: fileURL,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Car registration failed');

      toast.success('Car registered successfully!');
      router.push('/home_renter');
    } catch (error) {
      toast.error(error.message);
      console.error('❌ Registration error:', error);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-white">
      <Toaster />
      <button
        onClick={() => router.push('/home_renter')}
        className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-grow overflow-y-auto p-6">
        <h1 className="text-2xl font-bold px-6 mt-16">Car Registration</h1>

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="w-11/12">
            <input
              type="text"
              name="carModel"
              placeholder="Car Model"
              value={carData.carModel}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="carColor"
              placeholder="Car Color"
              value={carData.carColor}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="w-11/12">
            <input
              type="text"
              name="licensePlateNumber"
              placeholder="License Plate Number"
              value={carData.licensePlateNumber}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
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
