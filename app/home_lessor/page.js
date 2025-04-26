'use client';
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaUserAlt, FaPhoneAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNavLessor';

export default function HomePage() {
  const router = useRouter();
  const [lessorId, setLessorId] = useState(null);
  const [lessorDetails, setLessorDetails] = useState({});
  const [reservationsByDate, setReservationsByDate] = useState({});

  useEffect(() => {
    const storedLessorId = sessionStorage.getItem('lessorId');
    if (storedLessorId) {
      setLessorId(storedLessorId);
    } else {
      toast.error("Lessor ID not found");
      router.push('/login_lessor');
    }
  }, []);

  useEffect(() => {
    if (!lessorId) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`../api/lessorFetchHome?lessorId=${lessorId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setLessorDetails(data.lessorDetails);

        const groupedByDate = data.reservations.reduce((acc, reservation) => {
          const formattedDate = new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).format(new Date(reservation.reservation_date));

          if (!acc[formattedDate]) {
            acc[formattedDate] = [];
          }
          acc[formattedDate].push(reservation); // push full reservation object
          return acc;
        }, {});

        setReservationsByDate(groupedByDate);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error:', error);
      }
    };

    fetchData();
  }, [lessorId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toaster />
      <div className="flex items-center justify-between p-4 bg-white shadow-md">
        <div>
          <p className="text-sm text-gray-500">Hello, {lessorDetails.lessor_firstname}</p>
          <h1 className="text-xl font-bold">Manage Your Parking</h1>
        </div>
        <img
          src={lessorDetails.lessor_profile_pic || 'profile.jpeg'}
          alt="Profile"
          className="w-10 h-10 rounded-full"
        />
      </div>

      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {Object.keys(reservationsByDate).length > 0 ? (
          Object.entries(reservationsByDate).map(([date, reservations]) => (
            <div key={date}>
              <div className="flex items-center mb-2">
                <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
                  {date}
                </span>
              </div>

              {reservations.map((res, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-md mb-4">
                  {/* Address */}
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">📍 {res.location_name}</p>
                  </div>

                  {/* Car Info */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h2 className="text-xl font-semibold">{res.car_model}</h2>
                      <p className="text-sm text-gray-500 mt-1">License: {res.license_plate}</p>
                      <p className="text-sm text-gray-500 mt-1">Slot: {res.slot_number || '-'}</p>
                    </div>
                    <div className="flex flex-col text-right space-y-1">
                      <div className="flex items-center justify-end text-gray-600">
                        <FaUserAlt className="mr-1" />
                        <p className="text-sm">{res.first_name} {res.last_name}</p>
                      </div>
                      <div className="flex items-center justify-end text-gray-600">
                        <FaPhoneAlt className="mr-1" />
                        <p className="text-sm">{res.phone_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Timing Info */}
                  <div className="border-t pt-2 text-sm text-gray-700 space-y-1">
                    <p>🗓️ Reservation Date: {new Date(res.reservation_date).toLocaleDateString('en-GB')}</p>
                    <p>🕒 Start Time: {new Date(res.start_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    <p>🕔 End Time: {new Date(res.end_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    <p>💰 Total Price: {res.total_price} THB</p>
                    <p>⏳ Duration: {res.duration_day} Day(s) {res.duration_hour} Hour(s)</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No reservations available</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
