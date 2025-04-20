// reservation/page.js
"use client";
import React, { useEffect, useState } from 'react';
import ContactInfo from '../components/ContactInfo';
import ReservationSection from '../components/ReservationSection';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

const ParkingDetail = () => {
  const [parkingDetails, setParkingDetails] = useState(null);
  const [userCars, setUserCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchParkingDetails = async () => {
      try {
        const parkingLotId = sessionStorage.getItem('parkingLotId');
        if (!parkingLotId) {
          router.push('/login_renter');
          throw new Error('Parking lot ID is missing in session storage.');
        }
        const response = await fetch(`/api/LocationandPrice?id=${parkingLotId}`);
        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(errorDetails.error || 'Failed to fetch parking details.');
        }
        const data = await response.json();
        setParkingDetails(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchParkingDetails();
  }, []);

  useEffect(() => {
    const fetchUserCars = async () => {
      try {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
          router.push('/login_renter');
          throw new Error('User ID is missing in session storage.');
        }
        const response = await fetch(`/api/renterFetchCar?userId=${userId}`);
        if (!response.ok) {
          const errorDetails = await response.json();
          throw new Error(errorDetails.error || 'Failed to fetch user cars.');
        }
        const data = await response.json();
        setUserCars(data.cars || []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchUserCars();
  }, []);

  const handleCarSelection = (e) => {
    const carId = e.target.value;
    setSelectedCarId(carId);
    sessionStorage.setItem('carId', carId);
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!parkingDetails) return <p className="text-gray-500 text-center">Loading...</p>;

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col items-center py-8">
      <Toaster/>
      <div className="w-full max-w-screen-xl bg-white shadow-lg rounded-lg p-6 lg:p-12">
        <button onClick={() => router.push('/search')} className="absolute top-10 left-2 flex items-center justify-center w-12 h-12 rounded-lg border border-gray-200 shadow-sm text-black bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src={parkingDetails.locationImage || 'images/Map.png'} alt="Parking Lot" className="w-auto h-60 object-cover rounded-lg mb-6 mx-auto" />
        <div className="flex flex-row justify-between items-center mb-6 space-x-4">
          <span className="bg-blue-500 text-white font-bold px-4 py-2 rounded-full text-base lg:text-xl">{parkingDetails.parkingCode}</span>
          <span className="bg-green-500 text-white font-bold px-4 py-2 rounded-full text-base lg:text-xl">{parkingDetails.price}</span>
        </div>
        <p className="text-md font-semibold text-gray-800 mb-2">Address: {parkingDetails.address}</p>
        <ContactInfo lessorDetails={parkingDetails.lessorDetails} />

        <div className="mt-6 mb-5">
          <h3 className="text-lg font-semibold mb-2">Select Your Car:</h3>
          {userCars.length > 0 ? (
            <select value={selectedCarId || ''} onChange={handleCarSelection} className="w-full bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4">
              <option value="" disabled>Select your car</option>
              {userCars.map((car) => (
                <option key={car.car_id} value={car.car_id}>{car.car_model} - {car.car_color} - {car.license_plate}</option>
              ))}
            </select>
          ) : (
            <p className="text-gray-600">No cars registered.</p>
          )}
        </div>

        <ReservationSection parkingDetails={parkingDetails} selectedCarId={selectedCarId} />
      </div>
    </div>
  );
};

export default ParkingDetail;
