import React, { useEffect, useState } from "react";
import { verifySignature } from "/utils/crypto"; // Make sure this path is correct

const ReservationCard = () => {
  const [reservations, setReservations] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        if (!userId) {
          setError("User ID is missing. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/renterFetchReservation?userId=${userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setReservations([]);
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch reservations.");
        }
        const { reservationDetails } = await response.json();
        setReservations(reservationDetails);
      } catch (err) {
        console.error("Error fetching reservations:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleDeleteClick = (reservation) => {
    const currentTime = new Date();
    const startTime = new Date(reservation.start_time);
    if ((startTime - currentTime) / (1000 * 60 * 60) > 24) {
      setReservationToDelete(reservation);
      setShowConfirmation(true);
    } else {
      alert("Reservations with a start time less than 24 hours from now cannot be canceled.");
    }
  };

  const confirmDelete = async () => {
    if (!reservationToDelete) return;

    try {
      const response = await fetch(
        `/api/renterFetchReservation?reservationId=${reservationToDelete.reservation_id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete reservation.");

      setReservations(
        reservations.filter((res) => res.reservation_id !== reservationToDelete.reservation_id)
      );
      setShowConfirmation(false);
      setReservationToDelete(null);
    } catch (err) {
      console.error("Error deleting reservation:", err.message);
      setError("Failed to delete reservation. Please try again.");
    }
  };

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex space-x-4">
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 w-full">
            <h2 className="text-xl text-gray-500 font-semibold">No reservations yet.</h2>
            <p className="text-sm text-gray-400">Start by booking your first parking spot.</p>
          </div>
        ) : (
          reservations.map((reservation, index) => (
            <div
              key={index}
              className="bg-gray-800 text-white rounded-lg p-4 shadow-lg flex flex-col items-start mb-4 max-w-xl"
            >
              <div className="flex justify-between w-full mb-2">
                <h2 className="text-4xl font-bold">Reserved</h2>
                <span className="ml-2 bg-gray-600 text-sm py-3 px-2 rounded">
                  {reservation.location_name || "Loading..."}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <img src="mapPin.png" alt="location icon" className="mr-2 w-5 h-6" />
                <p className="text-lg font-semibold">
                  {reservation.location_name || "Loading..."}
                </p>
              </div>
              <div className="flex items-center mb-1">
                <img src="Clock.png" alt="clock icon" className="mr-2 w-5 h-5" />
                <p className="text-[16px]">
                  {new Date(reservation.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(reservation.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center mb-1">
                <img src="Calendar.png" alt="calendar icon" className="mr-2 w-5 h-5" />
                <p className="text-[16px]">
                  {`${new Date(reservation.start_time).toLocaleDateString("en-GB")} - ${new Date(
                    reservation.end_time
                  ).toLocaleDateString("en-GB")}`}
                </p>
              </div>
              <div className="flex justify-between items-center w-full mt-3">
                <button
                  onClick={() => handleDeleteClick(reservation)}
                  className="bg-red-500 text-white py-1 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <div className="text-right text-[16px] font-bold">
                  {`${reservation.duration_day} day${
                    reservation.duration_day > 1 ? "s" : ""
                  } ${reservation.duration_hour} hour${
                    reservation.duration_hour > 1 ? "s" : ""
                  }`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Cancellation</h2>
            <p>Are you sure you want to cancel this reservation?</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white py-2 px-4 rounded-lg"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationCard;
