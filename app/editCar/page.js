'use client';
import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaEdit, FaPlus } from "react-icons/fa";
import BottomNav from "../components/BottomNav";
import BackButton from "../components/BackButton";
import { useRouter } from "next/navigation";

export default function EditCar() {
  const router = useRouter();
  const fileUploadRefs = useRef([]);
  const [userId, setUserId] = useState(null);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      toast.error("Renter ID not found");
      router.push("/login_renter");
    }
  }, []);

  const fetchCars = async () => {
    const token = sessionStorage.getItem("jwtToken");
    const userId = sessionStorage.getItem("userId");
  
    if (!token || !userId) {
      toast.error("Missing authentication data.");
      return;
    }
  
    try {
      const res = await fetch(`/api/renterFetchCar?userId=${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error fetching data");
  
      setCars(data.cars || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching cars");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (userId) fetchCars();
  }, [userId]);

  const handleAddCar = () => {
    const newCar = {
      car_id: Date.now(),
      car_model: "",
      car_color: "",
      license_plate: "",
      carimage: "",
    };
    setCars((prev) => [newCar, ...prev]);
    setIsAdding(true);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setCars((prev) =>
      prev.map((car, i) => (i === index ? { ...car, [name]: value } : car))
    );
  };

  const handleSave = async (index) => {
    const car = cars[index];
    const isNewCar = typeof car.car_id === "number";

    if (!car.car_model || !car.car_color || !car.license_plate) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const token = sessionStorage.getItem("jwtToken");
      if (!token) throw new Error("Missing JWT token");

      let newImagePath = car.carimage;
      const fileInput = fileUploadRefs.current[index];

      let carId = car.car_id;
      if (fileInput?.files[0]) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("storageBucket", "carimage");
        formData.append("car_id", carId);

        const uploadRes = await fetch("/api/uploadCarImage", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || "Upload failed");

        newImagePath = uploadResult.publicUrl;
      }

      const payload = {
        carId,
        car_model: car.car_model,
        car_color: car.car_color,
        license_plate: car.license_plate,
        carimage: newImagePath,
      };

      const method = isNewCar ? "POST" : "PUT";
      const response = await fetch("/api/renterFetchCar", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(isNewCar ? { ...payload, userId } : payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");

      toast.success("Car saved successfully!");
      await fetchCars();
      setIsAdding(false);
    } catch (error) {
      toast.error("Error saving car");
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (index) => {
    const car = cars[index];
    try {
      const response = await fetch(`/api/renterFetchCar?carId=${car.car_id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Delete failed");

      setCars((prev) => prev.filter((_, i) => i !== index));
      setIsAdding(false);
      toast.success("Car deleted!");
    } catch (error) {
      toast.error("Error deleting car");
      console.error("Delete error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />
      <div className="relative flex-grow overflow-y-auto p-6">
        <BackButton targetPage="/setting_renter" />
        <div className="flex items-center justify-between w-full px-6 mt-5 py-4">
          <h1 className="text-2xl font-bold text-black text-left">
            Car Management
          </h1>
          <button
            type="button"
            onClick={handleAddCar}
            className="flex items-center bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600"
            disabled={isAdding}
          >
            <FaPlus className="mr-2" />
            Add Car
          </button>
        </div>

        {cars.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-xl text-gray-500 font-semibold">
              No cars registered
            </h2>
            <p className="text-sm text-gray-400">
              Please add a car to get started.
            </p>
          </div>
        )}

        {cars.map((car, index) => (
          <div
            key={car.car_id}
            className="space-y-6 mb-8 p-6 border rounded-lg shadow-lg w-11/12 mx-auto bg-white"
          >
            {car.carimage ? (
              <img
                src={car.carimage}
                alt="Car"
                className="max-w-[auto] h-40 object-cover rounded-lg mb-4 mx-auto"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded-lg mb-4 mx-auto">
                <span className="text-gray-500">No Image Available</span>
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6 flex flex-col items-center">
              {["car_model", "car_color", "license_plate"].map((field) => (
                <div key={field} className="w-full">
                  <label className="block text-gray-500">
                    {field.replace("_", " ").toUpperCase()}
                  </label>
                  <div className="flex items-center relative">
                    <input
                      type="text"
                      name={field}
                      value={car[field]}
                      onChange={(e) => handleChange(index, e)}
                      className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                    <FaEdit className="absolute right-4 text-gray-400" />
                  </div>
                </div>
              ))}

              <div className="w-full">
                <label className="block text-gray-500">Car Image</label>
                <input
                  ref={(el) => (fileUploadRefs.current[index] = el)}
                  type="file"
                  accept="image/*"
                  className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSave(index)}
                className="w-full bg-green-500 text-white py-3 rounded-lg"
              >
                SAVE
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="w-full bg-red-500 text-white py-3 rounded-lg mt-2"
              >
                DELETE
              </button>
            </form>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
