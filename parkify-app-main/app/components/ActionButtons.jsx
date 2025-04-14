"use client";
import React, { useState, useEffect } from "react";
import PaymentSuccess from "./PaymentSuccess";
import { Toaster, toast } from "react-hot-toast";

const ActionButtons = ({ parkingDetails, reservationData }) => {
  const [isConfirmPopupVisible, setIsConfirmPopupVisible] = useState(false);
  const [isPaymentSuccessVisible, setIsPaymentSuccessVisible] = useState(false);
  const [contact, setContact] = useState("Loading...");
  const [totalPrice, setTotalPrice] = useState(0);
  const [parkingLotId, setParkingLotId] = useState(null);

  // Destructure parkingDetails object
  const { parkingCode, price, address, locationUrl, lessorDetails } =
    parkingDetails || {};

  // Extract reservation data
  const { start, end } = reservationData || {};

  // Extract renterId and carId from sessionStorage
  const renterId = sessionStorage.getItem("userId");
  const carId = sessionStorage.getItem("carId");

  // Retrieve parkingLotId from sessionStorage
  useEffect(() => {
    const storedParkingLotId = sessionStorage.getItem("parkingLotId");
    if (storedParkingLotId) {
      setParkingLotId(storedParkingLotId);
    } else {
      console.error("Parking lot ID is missing in session storage.");
    }
  }, []);

  useEffect(() => {
    // Use lessor details if available, else fetch renter details
    if (lessorDetails?.phone) {
      setContact(lessorDetails.phone);
    } else {
      const fetchRenterDetails = async () => {
        if (!renterId) {
          console.error("Renter ID is missing. Please log in again.");
          return;
        }

        try {
          const renterResponse = await fetch(
            `/api/renterFetchRenter?renterId=${renterId}`
          );
          if (!renterResponse.ok)
            throw new Error("Failed to fetch renter details");
          const renterData = await renterResponse.json();
          setContact(renterData.renterDetails.phone_number);
        } catch (error) {
          console.error("Error fetching renter details:", error);
        }
      };

      fetchRenterDetails();
    }
  }, [renterId, lessorDetails]);

  const validateInputs = () => {
    const errors = [];
    if (!start) errors.push("Start datetime is missing.");
    if (!end) errors.push("End datetime is missing.");
    if (!price) errors.push("Price is missing.");
    if (!renterId) errors.push("Renter ID is missing.");
    if (!carId) errors.push("Car ID is missing.");
    if (!parkingLotId) errors.push("Parking Lot ID is missing.");
    return errors;
  };

  const handleDirectionsClick = () => {
    if (locationUrl) {
      window.open(locationUrl, "_blank"); // Open the location URL in a new tab
    } else {
      alert("Location URL not available.");
    }
  };

  const handlePaymentClick = () => {
    // Validate inputs and calculate total price
    const validationErrors = validateInputs();

    if (validationErrors.length > 0) {
      toast.error(
        `Please fix the following errors:\n- ${validationErrors.join("\n- ")}`
      );
      return;
    }

    // Parse the full datetime strings
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error("Invalid reservation details. Please check your input.");
      return;
    }

    // Validate that the start date is not earlier than today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset today's time to midnight

    if (startDateTime < today) {
      toast.error("Reservation start date cannot be earlier than today.");
      return;
    }

    // Calculate duration and total price
    const durationInHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
    const pricePerHour = parseFloat(price.split(" ")[0]);

    if (
      !isNaN(durationInHours) &&
      !isNaN(pricePerHour) &&
      durationInHours > 0
    ) {
      setTotalPrice(durationInHours * pricePerHour); // Set the total price
      setIsConfirmPopupVisible(true); // Show the modal
    } else {
      toast.error(
        "Invalid reservation details. Please ensure dates and times are correct."
      );
    }
  };

  const handleConfirmClick = async () => {
    try {
      const response = await fetch("/api/insertReservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parkingLotId,
          userId: renterId,
          startTime: start,
          endTime: end,
          pricePerHour: parseFloat(price.split(" ")[0]),
          carId,
        }),
      });

      const data = await response.json();

      if (data.status === "full") {
        toast.error("Parking lot is full.");
        return; // Do not proceed further
      }

      if (data.status === "error") {
        toast.error(data.message);
        return; // Do not proceed further
      }

      // Handle success
      setIsConfirmPopupVisible(false); // Close the confirmation modal
      setIsPaymentSuccessVisible(true); // Show the payment success modal
      toast.success(data.message);
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation. Please try again.");
    }
  };

  return (
    <div className="flex flex-row items-center justify-center space-x-4 mt-6">
      <Toaster />
      <button
        onClick={handleDirectionsClick}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center"
      >
        <img
          src="google-maps.png"
          alt="Google Maps"
          className="bg-white rounded-full p-1 w-5 h-5 mr-2"
        />
        Directions
      </button>
      <button
        onClick={handlePaymentClick}
        className="bg-green-500 text-white py-2 px-4 rounded-lg"
      >
        Payment
      </button>

      {isConfirmPopupVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-2">Confirm Reservation</h2>
            <p>
              <strong>Location:</strong> {parkingCode}
            </p>
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Total Price:</strong> {totalPrice.toFixed(2)} THB
            </p>
            <p>
              <strong>Contact:</strong> {"+66 " + contact}
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsConfirmPopupVisible(false)}
                className="bg-red-500 text-white py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClick}
                className="bg-green-500 text-white py-2 px-4 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentSuccessVisible && (
        <PaymentSuccess
          reservationData={{
            start,
            end,
            pricePerHour: parseFloat(price.split(" ")[0]), // Ensure price is parsed
          }}
          totalPrice={totalPrice}
          parkingDetails={parkingDetails}
          onClose={() => setIsPaymentSuccessVisible(false)}
        />
      )}
    </div>
  );
};

export default ActionButtons;
