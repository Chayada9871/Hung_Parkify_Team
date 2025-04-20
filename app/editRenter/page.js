"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import BottomNav from "../components/BottomNav";
import BackButton from "../components/BackButton";
import { useRouter } from "next/navigation";

export default function EditRenter() {
  const router = useRouter();
  const [renterId, setRenterId] = useState(null);
  const [renterDetails, setRenterDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [passwordEditable, setPasswordEditable] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");

  // Retrieve RenterId from sessionStorage on client side
  useEffect(() => {
    const storedRenterId = sessionStorage.getItem("userId");
    if (storedRenterId) {
      setRenterId(storedRenterId);
    } else {
      toast.error("Renter ID not found");
      router.push("/login_renter");
    }
  }, []);

  const fieldLabels = {
    first_name: "First Name",
    last_name: "Last Name",
    phone_number: "Phone Number",
    email: "Email",
    password: "Password",
  };

  const fetchRenterDetails = async () => {
    try {
      const response = await fetch(`../api/renterFetchRenter?renterId=${renterId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error fetching data");
      setRenterDetails(data.renterDetails || {});
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching Renter details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (renterId) {
      fetchRenterDetails();
    }
  }, [renterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRenterDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      renter_id: renterId,
      ...renterDetails,
    };

    // Include currentPassword only if the password is being updated
    if (passwordEditable && renterDetails.password) {
      payload.currentPassword = currentPasswordInput;
    }


    try {
      const updateResponse = await fetch(`../api/renterFetchRenter`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        toast.error(`Update failed: ${errorText || "Unknown error"}`);
        return; // Exit the function if the update fails
      }

      // Reset passwordEditable to hide password as "***"
      setPasswordEditable(false);
      setRenterDetails((prev) => ({
        ...prev,
        password: "", // Clear the password field
      }));

      toast.success("Renter details updated successfully!");
    } catch {
      // Display a generic toast error for unexpected issues
      toast.error("An unexpected error occurred while saving data");
    }
  };


  const handlePasswordFieldClick = () => {
    if (!passwordEditable) {
      setShowPasswordModal(true); // Show the modal for current password entry
      toast("Please enter your current password first to edit", { duration: 3000 });
    }
  };

  const handlePasswordVerification = async () => {
    try {
      const response = await fetch('/api/renterVerifyPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: renterId,
          currentPassword: currentPasswordInput,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Password verification failed");
        return; // Exit the function if verification fails
      }

      // Password verified successfully, allow password editing
      setPasswordEditable(true);
      setShowPasswordModal(false);
      toast.success("You can now edit your password");
      setRenterDetails((prev) => ({
        ...prev,
        password: result.decrypted_password,
      }));

    } catch {
      // Display a generic toast for unexpected issues
      toast.error("An unexpected error occurred during password verification.");
    }
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      <Toaster />
      <div className="relative flex-grow overflow-y-auto p-6">
        <BackButton targetPage="/setting_renter" />
        <h1 className="text-2xl font-bold text-black text-left w-full px-6 mt-5 py-4">
          Profile Setting
        </h1>
        <div className="flex flex-col items-center mt-10 ">
          {Object.keys(fieldLabels).map((field) => (
            <div
              key={field}
              className="flex items-center justify-between mb-4 w-full max-w-sm bg-gray-100 p-4 rounded-lg shadow-lg"
            >
              <label className="text-sm text-gray-400 w-1/3">
                {fieldLabels[field]}
              </label>
              <input
                type={field === "password" ? (passwordEditable ? "text" : "text") : "text"}
                name={field}
                value={
                  field === "password" && !passwordEditable
                    ? "*****" // Display "***" when not editable
                    : renterDetails[field] || ""
                }
                onChange={handleChange}
                className="text-gray-800 text-right w-2/3 focus:outline-none bg-transparent"
                readOnly={field === "password" && !passwordEditable}
                onClick={() => field === "password" && handlePasswordFieldClick()}
              />
              <FaEdit className="ml-2 text-gray-400" />
            </div>
          ))}

          <div className="flex justify-between w-full max-w-sm mt-5 space-x-4">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 mb-10"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
      <BottomNav />

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Enter Current Password</h2>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPasswordInput}
              onChange={(e) => setCurrentPasswordInput(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordVerification}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}