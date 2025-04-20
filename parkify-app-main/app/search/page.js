"use client";

import { useRouter } from "next/navigation";
import { AiOutlineClockCircle, AiOutlineClose } from "react-icons/ai";
import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import toast, { Toaster } from 'react-hot-toast';

export default function SearchPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

    // Check for userId in sessionStorage and redirect if missing
  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in.");
      router.push("/login_renter"); // Redirect to login if userId is missing
      return; // Prevent further execution
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { searchParams } = new URL(window.location.href);
      const place = searchParams.get("place");

      if (place) {
        setSearchText(place);
        saveRecentSearch(place);
      }

      const savedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
      setRecentSearches(savedSearches);
    }
  }, []);

  const saveRecentSearch = (search) => {
    if (!search || typeof window === "undefined") return;

    const savedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    const updatedSearches = [search, ...savedSearches.filter((item) => item !== search)].slice(0, 5);

    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    setRecentSearches(updatedSearches);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchText.trim()) {
      router.push(`/location/${encodeURIComponent(searchText.trim())}`);
      saveRecentSearch(searchText.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <Toaster />
      <BackButton targetPage="/home_renter" />
      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4 shadow-md mt-4">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={handleSearchSubmit}
          placeholder="Search in TU"
          autoFocus
          className="bg-transparent flex-1 text-gray-700 focus:outline-none"
        />
        <button onClick={() => router.push("/home_renter")}>
          <AiOutlineClose size={24} className="text-gray-500" />
        </button>
      </div>
      <div className="bg-gray-100 rounded-lg p-3 mb-8 shadow-sm">
        {recentSearches.length > 0 ? (
          recentSearches.map((search, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-gray-700 py-2 cursor-pointer"
              onClick={() => {
                setSearchText(search);
                router.push(`/location/${encodeURIComponent(search)}`);
              }}
            >
              <AiOutlineClockCircle size={20} />
              <span>{search}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No recent searches</p>
        )}
      </div>
      <div className="flex flex-col items-center justify-center flex-grow">
        <img
          src="/images/Map.png"
          alt="Location Pin"
          className="w-50 h-50 mb-4"
        />
        <h1 className="text-center text-xl font-semibold text-gray-800">
          Park with Ease,
          <br />
          with Parkify!
        </h1>
      </div>
    </div>
  );
}
