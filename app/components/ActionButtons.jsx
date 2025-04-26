"use client";
import React, { useState, useEffect } from "react";
import PaymentSuccess from "./PaymentSuccess";
import { Toaster, toast } from "react-hot-toast";

const ActionButtons = ({ parkingDetails, reservationData }) => {
  const [confirming, setConfirming] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [parkingLotId, setParkingLotId] = useState(null);

  const { start, end } = reservationData || {};
  const { price, parkingCode, address } = parkingDetails || {};

  const renterId = sessionStorage.getItem("userId");
  const carId = sessionStorage.getItem("carId");


  useEffect(() => {
    setParkingLotId(sessionStorage.getItem("parkingLotId"));
  }, []);

  const handlePayment = () => {
    if (!start || !end || !carId) {
      toast.error("Please complete reservation time and car selection.");
      return;
    }

    const duration = (new Date(end) - new Date(start)) / 3600000;
    const pricePerHour = parseFloat(price);
    if (duration > 0) {
      setTotalPrice(duration * pricePerHour);
      setConfirming(true);
    } else {
      toast.error("Invalid duration. End time must be after start time.");
    }
  };
  const handleConfirm = async () => {
    
    console.log("🟢 Confirm button clicked");
    const token = sessionStorage.getItem("jwtToken");
    const userId = sessionStorage.getItem("userId");
  
    if (!token || !userId) {
      toast.error("Missing authentication data.");
      return;
    }
  
    try {
      const payload = {
        parking_lot_id: parkingLotId,
        user_id: renterId,
        car_id: carId,
        reservation_date: new Date().toISOString().split("T")[0],
        start_time: start,
        end_time: end,
        total_price: totalPrice.toString(),
        duration_hour: (totalPrice / parseFloat(price)).toFixed(2),
        duration_day: "0",

      };
  
      console.log("📦 Raw Payload:", payload);
  
      const res = await fetch(`/api/insertReservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, userId }),
      });

  
      const data = await res.json();
      console.log("📩 Server response:", data);
  
      if (res.ok && data.status === "success") {
        setConfirming(false);
        setPaymentSuccess(true);
        toast.success("Reservation completed!");
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (err) {
      toast.error("❌ " + err.message);
      console.error("❌ Confirm error:", err);
    }
  };
  
  return (
    <div className="mt-6">
      <Toaster />
      <button
        onClick={handlePayment}
        className="bg-green-500 px-4 py-2 rounded-lg text-white"
      >
        Payment
      </button>

      {confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Confirm</h2>
            <p><strong>Location:</strong> {parkingCode}</p>
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Total:</strong> {totalPrice.toFixed(2)} THB</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setConfirming(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <PaymentSuccess
          reservationData={{ start, end, pricePerHour: parseFloat(price) }}
          totalPrice={totalPrice}
          parkingDetails={parkingDetails}
          onClose={() => setPaymentSuccess(false)}
        />
      )}
    </div>
  );
};

export default ActionButtons;