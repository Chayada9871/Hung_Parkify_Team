'use client';
import React, { useState, useEffect } from 'react';
import { InputField } from '../components/InputField';  
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import LoginButton from '../components/LoginButton';

export default function LoginPage() {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(null); // Lockout time in seconds
  const router = useRouter();

  useEffect(() => {
    
    sessionStorage.clear();

    // Check lockout status and start timer if needed
    const lockoutEnd = localStorage.getItem('lockoutEnd');
    if (lockoutEnd) {
      const timeLeft = Math.ceil((parseInt(lockoutEnd) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setLockoutTimeLeft(timeLeft);

        const interval = setInterval(() => {
          setLockoutTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              localStorage.removeItem('lockoutEnd');
              localStorage.setItem('failedAttempts', 0); // Reset failed attempts after lockout
              setFailedAttempts(0); // Reset attempts in state
              
              return null;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval); // Cleanup interval on unmount
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFailedLoginAttempt = () => {
    let attempts = parseInt(localStorage.getItem('failedAttempts')) || 0;
    attempts += 1;
    localStorage.setItem('failedAttempts', attempts);

    if (attempts >= 3) {
      const lockoutDuration = 30 * 1000; // 30 seconds lockout
      const lockoutEndTime = Date.now() + lockoutDuration;
      localStorage.setItem('lockoutEnd', lockoutEndTime);
      setLockoutTimeLeft(30);

      const interval = setInterval(() => {
        setLockoutTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            localStorage.removeItem('lockoutEnd');
            localStorage.setItem('failedAttempts', 0); // Reset failed attempts after lockout
            setFailedAttempts(0); // Reset attempts in state
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      toast.error('Too many failed attempts. Please wait 30 seconds.');
    } else {
      toast.error('Incorrect email or password. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutTimeLeft) {
      toast.error(`Too many attempts. Please wait for ${lockoutTimeLeft} seconds.`);
      return;
    }

    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch('/api/checkRenterLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        handleFailedLoginAttempt();
        return;
      }

      sessionStorage.setItem('userId', result.user_id);
      toast.success('Login successful!');
      localStorage.setItem('failedAttempts', 0); // Reset failed attempts
      localStorage.setItem("userAESKey", "12345678901234567890123456789012");

      router.push('/home_renter'); // Redirect to settings page
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
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
        Welcome back! <br /> Glad to see you, Again!
      </h1>

      <div className="flex-grow flex flex-col items-center w-full px-6">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center w-full">
          <div className="w-11/12">
            <InputField 
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={lockoutTimeLeft !== null} // Disable field during lockout
            />
          </div>

          <div className="w-11/12">
            <InputField 
              type="password" 
              name="password" 
              placeholder="Enter your password" 
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={lockoutTimeLeft !== null} // Disable field during lockout
            />
          </div>
        </form>
      </div>

      <div className="flex flex-col items-center mb-4 w-4/5 mx-auto">
        {lockoutTimeLeft !== null && (
          <p className="text-red-500 mb-4">
            Too many failed attempts. Please wait {lockoutTimeLeft} seconds to try again.
          </p>
        )}
        <LoginButton 
          onClick={handleSubmit} 
          className="w-full bg-black text-white py-3 rounded-lg"
          disabled={lockoutTimeLeft !== null}
        >
          Login
        </LoginButton>
        
        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link href="/register_renter" className="text-blue-400">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}
