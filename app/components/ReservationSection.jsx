// components/ReservationSection.jsx
"use client";
import React, { useState, useEffect } from "react";
import CalculateInput from "./CalculateInput";
import ActionButtons from "./ActionButtons";
import PaymentSuccess from "./PaymentSuccess";

const ReservationSection = ({ parkingDetails, selectedCarId }) => {
  const [reservationData, setReservationData] = useState({
    reservationDate: "",
    start: "",
    end: "",
    total: "0 Hours",
    totalPrice: 0,
  });
  const [parkingLotId, setParkingLotId] = useState(null);
  const [isPaymentSuccessVisible, setIsPaymentSuccessVisible] = useState(false);

  useEffect(() => {
    const storedParkingLotId = sessionStorage.getItem("parkingLotId");
    if (storedParkingLotId) {
      setParkingLotId(storedParkingLotId);
    } else {
      console.error("Parking lot ID is missing in session storage.");
    }
  }, []);

  const handleReservationChange = (newData) => {
    setReservationData((prevData) => ({ ...prevData, ...newData }));
  };

  const handlePaymentSuccessClose = () => {
    setIsPaymentSuccessVisible(false);
  };

  if (!parkingLotId) {
    return <p className="text-gray-500 text-center">Loading parking details...</p>;
  }

  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <CalculateInput
        onReservationChange={handleReservationChange}
        pricePerHour={parseFloat(parkingDetails.price)}
      />

      <ActionButtons
        reservationData={reservationData}
        parkingDetails={parkingDetails}
        selectedCarId={selectedCarId}
        parkingLotId={parkingLotId}
        onPaymentSuccess={() => setIsPaymentSuccessVisible(true)}
      />

      {isPaymentSuccessVisible && (
        <PaymentSuccess
          reservationData={reservationData}
          parkingDetails={parkingDetails}
          selectedCarId={selectedCarId}
          parkingLotId={parkingLotId}
          onClose={handlePaymentSuccessClose}
        />
      )}
    </div>
  );
};

export default ReservationSection;
