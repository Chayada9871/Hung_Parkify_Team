import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const ReservationCard = () => {
  const [reservations, setReservations] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      const token = sessionStorage.getItem("jwtToken");
      const userId = sessionStorage.getItem("userId");

      if (!token || !userId) {
        toast.error("Missing authentication data.");
        return;
      }

      try {
        const res = await fetch(`/api/renterFetchReservation?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error fetching data");

        setReservations(data.reservationDetails || []);
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
      toast.error("Cannot cancel reservations less than 24 hours in advance.");
    }
  };

  const confirmDelete = async () => {
    if (!reservationToDelete) return;

    const token = sessionStorage.getItem("jwtToken");

    try {
      const response = await fetch(
        `/api/renterFetchReservation?reservationId=${reservationToDelete.reservation_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete reservation.");

      setReservations(
        reservations.filter((r) => r.reservation_id !== reservationToDelete.reservation_id)
      );
      setShowConfirmation(false);
      setReservationToDelete(null);
      toast.success("Reservation cancelled.");
    } catch (err) {
      console.error("Error deleting reservation:", err.message);
      setError("Failed to delete reservation.");
      toast.error("Failed to delete reservation.");
    }
  };

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex space-x-4 flex-wrap">
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 w-full">
            <h2 className="text-xl text-gray-500 font-semibold">No reservations yet.</h2>
            <p className="text-sm text-gray-400">Start by booking your first parking spot.</p>
          </div>
        ) : (
          reservations.map((reservation, index) => (
            <div key={index} className="bg-gray-800 text-white rounded-lg p-4 shadow-lg w-full max-w-xl mb-4">
              <div className="flex justify-between w-full mb-2">
                <h2 className="text-2xl font-bold">Reserved</h2>
                <span className="bg-gray-600 text-sm px-2 py-1 rounded">
                  {reservation.location_name || "Unknown"}
                </span>
              </div>
              <div className="text-lg font-medium">
                {new Date(reservation.start_time).toLocaleDateString("en-GB")} –{" "}
                {new Date(reservation.end_time).toLocaleDateString("en-GB")}
              </div>
              <div className="text-sm mt-2">
                {new Date(reservation.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date(reservation.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="mt-3 flex justify-between items-center">
                <button
                  onClick={() => handleDeleteClick(reservation)}
                  className="bg-red-500 px-4 py-2 rounded-lg text-white"
                >
                  Cancel
                </button>
                <div className="text-sm font-semibold">
                  {reservation.duration_day} day(s), {reservation.duration_hour} hour(s)
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h3 className="text-xl font-bold mb-4">Confirm Cancellation</h3>
            <p>Are you sure you want to cancel this reservation?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
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
