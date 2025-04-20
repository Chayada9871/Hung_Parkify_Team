"use client";
import React, { useState, useEffect } from "react";
import PaymentSuccess from "./PaymentSuccess";
import { Toaster, toast } from "react-hot-toast";
import {
  STATIC_AES_KEY,
  encryptAES,
  signData,
  encryptAESKeyWithPublicKey,
} from "/utils/crypto";

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
    const duration = (new Date(end) - new Date(start)) / 3600000;
    const pricePerHour = parseFloat(price);
    if (duration > 0) {
      setTotalPrice(duration * pricePerHour);
      setConfirming(true);
    } else {
      toast.error("Invalid duration");
    }
  };

  const handleConfirm = async () => {
    try {
      const aesKey = STATIC_AES_KEY;

      // 1. Prepare raw (unencrypted) data
      const rawPayload = {
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

      // 2. Sign the data
      const signature = signData(JSON.stringify(rawPayload));

      // 3. Encrypt sensitive data
      const encryptedPayload = {
        parking_lot_id: parkingLotId,
        user_id: renterId,
        car_id: carId,
        reservation_date: rawPayload.reservation_date,
        start_time: encryptAES(rawPayload.start_time, aesKey),
        end_time: encryptAES(rawPayload.end_time, aesKey),
        total_price: encryptAES(rawPayload.total_price, aesKey),
        duration_hour: encryptAES(rawPayload.duration_hour, aesKey),
        duration_day: encryptAES(rawPayload.duration_day, aesKey),
      };

      // 4. Send to backend
      const res = await fetch("/api/insertReservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: encryptedPayload,
          signature,
          rawPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setConfirming(false);
        setPaymentSuccess(true);
        toast.success("Reservation completed!");
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (err) {
      toast.error("Failed to send request");
      console.error("Confirm error:", err);
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
            <p>
              <strong>Location:</strong> {parkingCode}
            </p>
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Total:</strong> {totalPrice.toFixed(2)} THB
            </p>
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
