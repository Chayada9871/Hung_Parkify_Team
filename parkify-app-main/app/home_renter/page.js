"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import the useRouter hook
import Link from "next/link";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import PlaceCard from "../components/PlaceCard";
import BottomNav from "../components/BottomNav";
import ReservedCard from "../components/ReservedCard";
import { Toaster, toast } from "react-hot-toast";

export default function HomePage() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true); // Add loading state
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const fetchUserName = async () => {
      // Retrieve userId from sessionStorage
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        toast.error("User ID not found");
        router.push("/login_renter"); // Redirect if no userId is found
        return; // Prevent further execution
      }

      try {
        const response = await fetch(
          `/api/renterFetchRenter?renterId=${userId}`
        );
        if (!response.ok) {
          throw new Error(
            `Error fetching renter details: ${response.statusText}`
          );
        }

        const { renterDetails } = await response.json();

        if (renterDetails) {
          setUserName(`${renterDetails.first_name} ${renterDetails.last_name}`);
        } else {
          console.warn("Renter details not found.");
        }
      } catch (err) {
        console.error("Unexpected error fetching renter details:", err);
      } finally {
        setLoading(false); // Ensure loading state is updated
      }
    };

    fetchUserName();
  }, [router]); // Add router to the dependency array

  // Block rendering while loading
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-20">
      <Toaster />
      {/* Header */}
      <Header userName={userName} />

      {/* Search Bar */}
      <SearchBar />

      {/* Recent Places Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Places
        </h2>

        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto space-x-4 pb-2">
          <Link href="/search?place=Yaowarat">
            <PlaceCard imageSrc="/images/yaowarat.jpg" name="Yaowarat" />
          </Link>
          <Link href="/search?place=Siam">
            <PlaceCard imageSrc="/images/siam.jpg" name="Siam" />
          </Link>
          <Link href="/search?place=Don Muang">
            <PlaceCard imageSrc="/images/donmuang.jpg" name="Don Muang" />
          </Link>
        </div>
      </div>
      <ReservedCard />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
