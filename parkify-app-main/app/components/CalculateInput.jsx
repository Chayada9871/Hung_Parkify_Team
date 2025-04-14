"use client";
import React, { useState, useEffect } from "react";

const CalculateInput = ({ onReservationChange, pricePerHour }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [total, setTotal] = useState("0 Hours");
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    validateAndCalculateTotal();
    onReservationChange({
      start: `${startDate}T${startTime}:00`,
      end: `${endDate}T${endTime}:00`,
      total,
      totalPrice,
    });
  }, [startDate, endDate, startTime, endTime]);

  const validateAndCalculateTotal = () => {
    setError(""); // Clear previous errors
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);

      if (end <= start) {
        setError("End date and time must be later than start date and time.");
        setTotal("0 Hours");
        setTotalPrice(0);
        return;
      }

      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      setTotal(
        `${Math.floor(diffHours / 24)} Day ${Math.floor(diffHours % 24)} Hour`
      );
      setTotalPrice(diffHours * pricePerHour); // Calculate total price
    } else {
      setTotal("0 Hours");
      setTotalPrice(0);
    }
  };

  return (
    <div>
      {/* Date Inputs */}
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
          className="p-2 border rounded-md"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
          className="p-2 border rounded-md"
        />
      </div>

      {/* Time Inputs */}
      <div className="flex space-x-4 mb-4">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="Start Time"
          className="p-2 border rounded-md"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="End Time"
          className="p-2 border rounded-md"
        />
      </div>

      {/* Error Message */}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {/* Total and Total Price */}
      <p className="mt-4 font-semibold">
        <span className="text-gray-500">Total:</span> {total}
      </p>
      <p className="mt-2 font-semibold">
        <span className="text-gray-500">Total Price:</span>{" "}
        {totalPrice.toFixed(2)} THB
      </p>
    </div>
  );
};

export default CalculateInput;
