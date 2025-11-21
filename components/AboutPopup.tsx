"use client";

import { useState } from 'react';

export default function AboutPopup({ open: initialOpen = false }: { open?: boolean }) {
  const [open, setOpen] = useState(initialOpen);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100"
      aria-label="Open About"
    >
      About
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />

      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative z-10">
        <h2 className="text-lg font-bold mb-2">About Celebra</h2>
        <p className="text-sm text-gray-700 mb-4">Welcome to Celebra — a lightweight social app for sharing moments and connecting with friends.</p>

        <div className="text-xs text-gray-500 mb-4">Developed by <span className="font-semibold">EYRON</span></div>

        <div className="flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
