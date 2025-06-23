"use client";

import React from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong!</h2>
      <p className="text-gray-700 mb-6">{error.message || "An unexpected error occurred."}</p>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
} 