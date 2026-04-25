"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function PlaceOrderButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-full block text-center bg-green-600 text-white text-lg font-bold py-4 px-6 rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all mb-6"
      >
        Place Order
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Payment Gateway</h3>
              <button 
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 text-center text-gray-700">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">Cashfree Integration Pending</p>
              <p className="text-gray-500">Payments will be made by Cashfree PG soon. We are finalizing our merchant compliance setup.</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => setShowDialog(false)}
                className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
