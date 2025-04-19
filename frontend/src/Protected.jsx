import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Protected() {
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProtected = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        setMessage(text);
      } else {
        setMessage("Access denied or not authenticated.");
      }
    } catch (err) {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded shadow text-center">
      <div className="flex justify-center mb-4">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" stroke="#2563eb" strokeWidth="4" fill="#e0e7ff" />
          <path d="M16 24l6 6 10-10" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <button
        onClick={fetchProtected}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none mb-4"
      >
        {loading ? "Loading..." : "Fetch Protected Resource"}
      </button>
      {message && <div className="mt-2 text-blue-700 dark:text-blue-300 font-medium">{message}</div>}
    </div>
  );
}
