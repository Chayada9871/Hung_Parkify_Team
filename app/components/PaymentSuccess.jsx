import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PaymentSuccess = ({
  reservationData,
  totalPrice,
  parkingDetails,
  onClose, // Optional, in case you need a custom onClose handler
}) => {
  const router = useRouter();
  const [bookerName, setBookerName] = useState("Loading...");
  const [location, setLocation] = useState("Loading...");

  const { start, end, pricePerHour } = reservationData || {};
  const { address, lessorDetails } = parkingDetails || {};

  // Format start and end datetime for display
  const formattedStart = new Date(start).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const formattedEnd = new Date(end).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data with:", { reservationData, parkingDetails });

        // Use lessorDetails if available, otherwise fetch booker details
        if (lessorDetails?.name) {
          setBookerName(lessorDetails.name);
        } else {
          const renterResponse = await fetch(
            `/api/renterFetchRenter?renterId=${sessionStorage.getItem(
              "userId"
            )}`
          );
          if (!renterResponse.ok) {
            console.error("Error fetching booker details.");
            return;
          }
          const renterData = await renterResponse.json();
          setBookerName(
            `${renterData.renterDetails.first_name} ${renterData.renterDetails.last_name}`
          );
        }

        // Set location directly from parkingDetails
        setLocation(address);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [reservationData, parkingDetails]);

  const handleClose = () => {
    router.push("/home_renter"); // Always navigate to the home_renter page
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-black text-white rounded-lg w-100 p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-lg"
        >
          X
        </button>
        <h2 className="text-2xl font-bold text-center mb-1">
          Reservation Successful!
        </h2>
        <p className="text-gray-400 text-center mb-4">
          Your payment has been successfully completed.
        </p>

        <div className="flex justify-between items-center bg-gray-800 py-4 px-6 rounded-lg mb-6">
          <p className="text-gray-400 text-lg">Total Payment</p>
          <p className="text-2xl font-bold">THB {totalPrice.toFixed(2)}</p>
          <div className="bg-green-500 w-6 h-6 rounded-full flex items-center justify-center ml-2">
            <span>✔</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-gray-400 font-semibold pr-2">Location</p>
            <p className="font-semibold">{location}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-400 font-semibold">
              Date & Time Reservation
            </p>
            <div className="text-right pl-5">
              <p>
                <span className="text-white">Start: {formattedStart}</span>
              </p>
              <p>
                <span className="text-white">End: {formattedEnd}</span>
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-400 font-semibold">Booker Name</p>
            <p>{bookerName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
