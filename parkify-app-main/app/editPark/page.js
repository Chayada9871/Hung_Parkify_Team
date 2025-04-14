'use client';
import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaEdit, FaPlus } from "react-icons/fa";
import BottomNav from "../components/BottomNavLessor";
import BackButton from "../components/BackButton";
import { useRouter } from "next/navigation";

export default function EditParking() {
  const router = useRouter();
  const fileUploadRefs = useRef([]);
  const [lessorId, setLessorId] = useState(null); // State to store lessorId
  const [lessorDetails, setLessorDetails] = useState({});
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch lessorId from sessionStorage on client side
  useEffect(() => {
    const lessorId = sessionStorage.getItem("lessorId");
    if (lessorId) {
      setLessorId(lessorId);
    } else {
      toast.error("Lessor ID not found");
      router.push("/login_lessor");
    }
  }, []);

  const fetchParkingLots = async () => {
    if (!lessorId) return; // Wait until lessorId is set

    try {
      const response = await fetch(`/api/lessorFetchPark?lessorId=${lessorId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error fetching data");

      setLessorDetails(data.lessorDetails);
      const sortedParkingLots = data.parkingLots.sort((a, b) => b.total_slots - a.total_slots);
      setParkingLots(sortedParkingLots || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching parking lots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessorId) {
      fetchParkingLots();
    }
  }, [lessorId]);

  const handleAddParkingLot = () => {
    const newParkingLotId = Date.now(); // Temporary unique ID
    const newParkingLot = {
      parking_lot_id: newParkingLotId,
      location_name: "",
      address: "",
      location_url: "",
      total_slots: "",
      price_per_hour: "",
      location_image: "",
    };
    setParkingLots((prev) => [newParkingLot, ...prev]);
    setIsAdding(true);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setParkingLots((prev) =>
      prev.map((lot, i) => (i === index ? { ...lot, [name]: value } : lot))
    );
  };

 const handleSave = async (index) => {
  const lot = parkingLots[index];
  const isNewParkingLot = typeof lot.parking_lot_id === "number";

  // Validation for fields
  if (
    !lot.location_name ||
    !lot.address ||
    !lot.location_url ||
    !lot.total_slots ||
    !lot.price_per_hour
  ) {
    toast.error("Please fill in all fields");
    return;
  }

  // Ensure total_slots and price_per_hour are greater than 0
  if (parseInt(lot.total_slots) <= 0) {
    toast.error("Total slots must be greater than 0");
    return;
  }

  if (parseFloat(lot.price_per_hour) <= 0) {
    toast.error("Price per hour must be greater than 0");
    return;
  }

  try {
    let newImagePath = lot.location_image;
    const fileInput = fileUploadRefs.current[index];

    let parkingLotId = lot.parking_lot_id;
    if (isNewParkingLot) {
      const payload = {
        lessorId,
        location_name: lot.location_name,
        address: lot.address,
        location_url: lot.location_url,
        total_slots: lot.total_slots,
        price_per_hour: lot.price_per_hour,
        location_image: newImagePath || "",
      };

      const createResponse = await fetch("/api/lessorFetchPark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createResult = await createResponse.json();
      if (!createResponse.ok) throw new Error(createResult.error || "Failed to create parking lot");

      parkingLotId = createResult.parkingLotId;
      setParkingLots((prev) =>
        prev.map((lotItem, i) =>
          i === index ? { ...lotItem, parking_lot_id: parkingLotId } : lotItem
        )
      );
    }

    if (fileInput && fileInput.files[0]) {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storageBucket", "carpark");
      formData.append("parkingLotId", parkingLotId);

      const uploadResponse = await fetch("/api/uploadParking", {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult.error || "File upload failed");

      newImagePath = uploadResult.publicUrl;
    }

    await fetch("/api/lessorFetchPark", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parkingLotId,
        location_name: lot.location_name,
        address: lot.address,
        location_url: lot.location_url,
        total_slots: lot.total_slots,
        price_per_hour: lot.price_per_hour,
        location_image: newImagePath,
      }),
    });

    await fetchParkingLots();
    setIsAdding(false);
    toast.success("Parking lot saved successfully!");
  } catch (error) {
    toast.error("Error saving data");
    console.error("Save error:", error);
  }
};


  const handleDelete = async (index) => {
    const lot = parkingLots[index];
    try {
      const deleteResponse = await fetch(`/api/lessorFetchPark?parkingLotId=${lot.parking_lot_id}`, {
        method: "DELETE",
      });

      const deleteResult = await deleteResponse.json();
      if (!deleteResponse.ok) throw new Error(deleteResult.error || "Delete failed");

      setParkingLots((prev) => prev.filter((_, i) => i !== index));
      setIsAdding(false);
      toast.success("Parking lot deleted!");

      fetchParkingLots();
    } catch (error) {
      toast.error("Error deleting parking lot");
      console.error("Delete error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />
      <div className="relative flex-grow overflow-y-auto p-6">
        <BackButton targetPage="/setting_lessor" />

        <div className="flex items-center justify-between w-full px-6 mt-5 py-4">
          <h1 className="text-2xl font-bold text-black text-left">
            Parking Lots Setting
          </h1>
          <button
            type="button"
            onClick={handleAddParkingLot}
            className="flex items-center bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600"
            disabled={isAdding}
          >
            <FaPlus className="mr-2" />
            Add Parking Lots
          </button>
        </div>

        {parkingLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-xl text-gray-500 font-semibold">No parking lots available.</h2>
            <p className="text-sm text-gray-400">Please add a parking lot to get started.</p>
          </div>
        ) : (
          parkingLots.map((lot, index) => (
            <div
              key={lot.parking_lot_id}
              className="space-y-6 mb-8 p-6 border rounded-lg shadow-lg w-11/12 mx-auto bg-white"
            >
              {lot.location_image ? (
                <img
                  src={lot.location_image}
                  alt="Parking Lot"
                  className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded-lg mb-4 mx-auto"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded-lg mb-4 mx-auto">
                  <span className="text-gray-500 text-center">No Image Available</span>
                </div>
              )}

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6 flex flex-col items-center">
                {["location_name", "address", "location_url", "total_slots", "price_per_hour"].map((field) => (
                  <div key={field} className="w-full relative">
                    <label className="block text-gray-500">{field.replace("_", " ").toUpperCase()}</label>
                    <div className="flex items-center relative">
                      <input
                        type={field.includes("slots") || field.includes("price") ? "number" : "text"}
                        name={field}
                        value={lot[field]}
                        onChange={(e) => handleChange(index, e)}
                        className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <FaEdit className="absolute right-4 text-gray-400 cursor-pointer" />
                    </div>
                  </div>
                ))}
                <div className="w-full">
                  <label className="block text-gray-500">Location Image</label>
                  <input
                    ref={(el) => (fileUploadRefs.current[index] = el)}
                    type="file"
                    accept="image/*"
                    className="w-full p-4 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(index)}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 mt-2"
                >
                  DELETE
                </button>
              </form>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
