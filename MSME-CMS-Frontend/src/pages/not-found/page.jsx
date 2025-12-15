import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ImCircleLeft } from "react-icons/im";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-5">
      <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full animate-fade-in">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent animate-bounce">
          404
        </h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Oops! The page you're looking for seems to have vanished into thin air.
        </p>
        <div className="space-x-4 justify-center items-center flex">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <ImCircleLeft  />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 