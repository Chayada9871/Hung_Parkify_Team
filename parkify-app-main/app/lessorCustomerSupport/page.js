'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import BottomNav from "../components/BottomNavLessor";
import BackButton from '../components/BackButton';

export default function CustomerSupportPage() {
  const [issue, setIssue] = useState('');
  const [details, setDetails] = useState('');
  const [lessorId, setLessorId] = useState(null);
  const router = useRouter();


// Retrieve RenterId from sessionStorage on client side
useEffect(() => {
const storedLessorId = sessionStorage.getItem("lessorId");

// Hardcoded for testing; replace with session storage if needed
if (storedLessorId) {
    setLessorId(storedLessorId);
} else {
    toast.error("Lessor ID not found");
    router.push("/login_lessor");
}
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issue || !details) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('/api/lessorSubmitComplaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complain: issue, detail: details, lessorId: lessorId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit complaint');
      }

      toast.success(result.message || 'Issue submitted successfully!');
      setIssue('');
      setDetails('');
    } catch (error) {
      toast.error(error.message || 'An error occurred. Please try again.');
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white p-6">
      <Toaster />

      <div className="relative flex-grow overflow-y-auto p-6">
        {/* Back Button */}
        <BackButton targetPage="/setting_lessor" />

        {/* Heading */}
        <h1 className="text-2xl font-bold text-black text-left w-full px-2 mt-5 py-4">
          Customer Support
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Issue Input */}
          <div>
            <input
              type="text"
              placeholder="Issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>

          {/* Details Textarea */}
          <div>
            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-4 h-32 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}