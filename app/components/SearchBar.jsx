// components/SearchBar.js
"use client"; // Add this line

import { useRouter } from "next/navigation";

export default function SearchBar() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/search")}
            className="w-full px-4 py-2 mt-4 bg-gray-100 rounded-lg text-gray-500 text-left focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
            Where to go ?
        </button>
    );
}