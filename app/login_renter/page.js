'use client';

import React, { useState, useEffect } from 'react';
import { InputField } from '../components/InputField';  
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import LoginButton from '../components/LoginButton';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(null);
  const router = useRouter();

  useEffect(() => {
    sessionStorage.clear();
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
              localStorage.setItem('failedAttempts', 0);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFailedLoginAttempt = () => {
    let attempts = parseInt(localStorage.getItem('failedAttempts')) || 0;
    attempts += 1;
    localStorage.setItem('failedAttempts', attempts);

    if (attempts >= 3) {
      const lockoutEnd = Date.now() + 30000; // 30 seconds
      localStorage.setItem('lockoutEnd', lockoutEnd);
      setLockoutTimeLeft(30);
      toast.error('Too many failed attempts. Please wait 30 seconds.');
    } else {
      toast.error('Incorrect email or password. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutTimeLeft) {
      toast.error(`Too many attempts. Please wait ${lockoutTimeLeft} seconds.`);
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
      sessionStorage.setItem('jwtToken', result.token);
      localStorage.setItem('userAESKey', result.sessionKey);
      localStorage.setItem('failedAttempts', 0);

      toast.success('Login successful!');
      router.push('/home_renter');
    } catch (error) {
      toast.error('An unexpected error occurred.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />

      <button 
        onClick={() => router.push('/welcomerenter')} 
        className="absolute top-10 left-4 w-12 h-12 border rounded-lg"
      >
        ←
      </button>

      <h1 className="text-2xl font-bold px-6 mt-16">Welcome back!<br />Glad to see you again!</h1>

      <div className="flex-grow flex flex-col items-center px-6">
        <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
          <div className="w-11/12">
            <InputField
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={lockoutTimeLeft !== null}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="w-11/12">
            <InputField
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={lockoutTimeLeft !== null}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
        </form>
      </div>

      <div className="flex flex-col items-center mb-4 w-4/5 mx-auto">
        {lockoutTimeLeft !== null && (
          <p className="text-red-500 mb-4">
            Please wait {lockoutTimeLeft} seconds to try again.
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
          Don’t have an account?{' '}
          <Link href="/register_renter" className="text-blue-400">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}
