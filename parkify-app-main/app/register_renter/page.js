'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import RegisterButton from '../components/RegisterButton';
import { InputField } from '../components/InputField';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const router = useRouter();

  useEffect(() => {
    sessionStorage.clear();
  }, []);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate input fields
  if (!formData.email || !formData.password || !formData.confirmPassword) {
    toast.error('Please fill in all fields');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }

  try {
    // Step 1: Check email availability
    const response = await fetch('/api/checkRenterEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Show toast if the email already exists
      toast.error(result.error || 'Failed to validate email',{duration: 1000,});
      return;
    }

    // Step 2: Temporarily store email and password for later use in profile registration
    sessionStorage.setItem('userEmail', formData.email);
    sessionStorage.setItem('userPassword', formData.password);

    // Redirect to the profile page
    router.push('/regisProfile_renter');
  } catch (error) {
    toast.error('An unexpected error occurred. Please try again.');
    console.error('Error during registration:', error);
  }
};


  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />

      {/* Back Button */}
      <button 
        onClick={() => router.push('/welcomerenter')} 
        className="absolute top-10 left-4 flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 shadow-sm text-black"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-16 py-10">
        Hello! Register to get <br /> started
      </h1>

      <div className="flex-grow flex flex-col items-center w-full px-6">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center w-full">
          <div className="w-11/12">
            <InputField 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <InputField 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-11/12">
            <InputField 
              type="password" 
              name="confirmPassword" 
              placeholder="Confirm password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      <div className="flex flex-col items-center mb-4 w-4/5 mx-auto">
        <RegisterButton variant="black" type="submit" className="w-full bg-black text-white py-3 rounded-lg" onClick={handleSubmit}>
          Register
        </RegisterButton>
        
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login_renter" className="text-blue-400">
            Login Now
          </Link>
        </p>
      </div>
    </div>
  );
}
