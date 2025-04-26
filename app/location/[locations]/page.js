"use client";

import { useRouter } from "next/navigation";
import { AiOutlineClose } from "react-icons/ai";
import { useState, useEffect } from "react";
import BackButton from "../../components/BackButton";
import { Toaster, toast } from "react-hot-toast";

export default function LocationPage({ params }) {
  const [location, setLocation] = useState("");
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [parkingData, setParkingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("User ID not found. Please log in.");
      router.push("/login_renter");
      return;
    }
  }, [router]);

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const decodedLocation = decodeURIComponent(resolvedParams.locations).toLowerCase();
      setLocation(decodedLocation);
      setSearchText(decodedLocation);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!location) return;

    const fetchParkingData = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("Missing authentication token.");
        }

        const response = await fetch(
          `/api/renterFetchParking?locationName=${encodeURIComponent(location)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`, // ✅ Add Authorization header
            },
          }
        );

        if (!response.ok) {
          setParkingData([]);
          return;
        }

        const { parkingLots } = await response.json();
        setParkingData(parkingLots);
      } catch (err) {
        console.error("❌ Error fetching parking data:", err);
        toast.error("Failed to load parking data.");
      } finally {
        setLoading(false);
      }
    };

    fetchParkingData();
  }, [location]);

  const handleParkingClick = (parkingLotId, availableSlots) => {
    if (availableSlots === 0) {
      toast.error("This parking lot is full. Please select another.");
      return;
    }
    sessionStorage.setItem("parkingLotId", parkingLotId);
    router.push("/reservation");
  };

  const getImageForLocation = (locationName) => {
    const locationImages = {
      yaowarat: "/images/yaowarat.jpg",
      siam: "/images/siam.jpg",
      "don muang": "/images/donmuang.jpg",
    };
    return locationImages[locationName.toLowerCase()] || null;
  };

  const locationImage = getImageForLocation(location);

  return (
    <div className="min-h-screen bg-white p-4 space-y-4">
      <Toaster position="top-center" reverseOrder={false} />
      <BackButton targetPage="/search" />

      {/* Search Box */}
      <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-md mt-7">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search location"
          className="flex-1 bg-transparent text-gray-700 focus:outline-none"
        />
        <button onClick={() => router.push("/search")}>
          <AiOutlineClose size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Location Image */}
      {locationImage && (
        <div className="rounded-lg overflow-hidden shadow-lg relative mb-8">
          <img
            src={locationImage}
            alt={location}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white text-center py-2">
            {location.charAt(0).toUpperCase() + location.slice(1)}
          </div>
        </div>
      )}

      {/* Parking Data */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center">Loading parking data...</p>
        ) : parkingData.length > 0 ? (
          parkingData.map((spot) => (
            <div
              key={spot.parking_lot_id}
              className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-md cursor-pointer"
              onClick={() => handleParkingClick(spot.parking_lot_id, spot.available_slots)}
            >
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {spot.price_per_hour} THB / Hour
                </h3>
                <p className="text-sm text-gray-500">{spot.address}</p>
                <p
                  className={`text-sm font-semibold ${
                    spot.available_slots > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Available Slots: {spot.available_slots}
                </p>
              </div>

              <img
                src="/images/parking-icon.png"
                alt="Parking Icon"
                className="w-8 h-8"
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-xl text-gray-500 font-semibold">
              No parking spots available
            </h2>
            <p className="text-sm text-gray-400">
              Sorry, we couldn't find any parking spots for "{location}".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
