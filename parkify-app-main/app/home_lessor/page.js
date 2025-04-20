'use client';
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaUserAlt, FaPhoneAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNavLessor';

export default function HomePage() {
  const router = useRouter();
  const [lessorId, setLessorId] = useState(null); // Initialize lessorId in state
  const [lessorDetails, setLessorDetails] = useState({});
  const [reservationsByDate, setReservationsByDate] = useState({});

  useEffect(() => {
    // Check for sessionStorage only on the client side
    const storedLessorId = sessionStorage.getItem('lessorId');
  
    if (storedLessorId) {
      setLessorId(storedLessorId); // Set lessorId in state
    } else {
      toast.error("Lessor ID not found");
      router.push('/login_lessor'); // Redirect if no lessorId is found
    }
  }, []);

  useEffect(() => {
    
    if (!lessorId) return; // Wait until lessorId is set

    const fetchData = async () => {
      try {
        const response = await fetch(`../api/lessorFetchHome?lessorId=${lessorId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        console.log(response);

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
          acc[formattedDate].push({
            carModel: reservation.car_model,
            license: reservation.license_plate,
            address: reservation.address,
            name: `${reservation.first_name} ${reservation.last_name}`,
            phone: reservation.phone_number,
            duration: [
              reservation.duration_day > 0 ? `${reservation.duration_day} Day${reservation.duration_day > 1 ? 's' : ''}` : '',
              reservation.duration_hour > 0 ? `${reservation.duration_hour} Hour${reservation.duration_hour > 1 ? 's' : ''}` : ''
            ].filter(Boolean).join(' '),
            time: reservation.start_time && reservation.end_time
              ? `${new Date(reservation.start_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(reservation.end_time).toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: true })}`
              : 'ALL DAY',
          });
          return acc;
        }, {});

        setReservationsByDate(groupedByDate);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error:', error);
      }
    };

    fetchData();
  }, [lessorId]); // Trigger this effect only when lessorId is available

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toaster />
      <div className="flex items-center justify-between p-4 bg-white shadow-md">
        <div>
          <p className="text-sm text-gray-500">Hello, {lessorDetails.lessor_firstname}</p>
          <h1 className="text-xl font-bold">Made them easily <br /> Parking</h1>
        </div>
        <img
          src={lessorDetails.lessor_profile_pic|| 'profile.jpeg'}
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
  
              {reservations.map((booking, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-md mb-4">
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">{booking.address}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">{booking.carModel}</h2>
                      <p className="text-sm text-gray-500 mt-1">{booking.license}</p>
                      <p className="text-sm text-gray-500 mt-1">{booking.time}</p>
                    </div>
  
                    <div className="flex flex-col items-end text-right space-y-1">
                      <div className="flex items-center text-gray-600">
                        <FaUserAlt className="mr-1" />
                        <p className="text-sm">{booking.name}</p>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaPhoneAlt className="mr-1" />
                        <p className="text-sm">{booking.phone}</p>
                      </div>
                      <div className="text-customBlue font-semibold text-lg">
                        {booking.duration}
                      </div>
                    </div>
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
