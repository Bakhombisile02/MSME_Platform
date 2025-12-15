"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/apis/auth-api";
import toast from "react-hot-toast";

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email_address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await loginUser(formData.email_address, formData.password);
      // Pass user_type from response, default to 'user' if not present
      const userType = response.user?.user_type || 'user';
      login(response.user.id, response.token, userType);
      toast.success("You are Logged in!")
      router.push("/add-business"); // Redirect to Add business page after successful login
    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = err.response.data?.message || err.response.data?.error || "Login failed. Please check your credentials.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your internet connection.");
        toast.error("Network error. Please try again.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || "An unexpected error occurred. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-[80rem] bg-white flex flex-col lg:flex-row overflow-hidden rounded-lg shadow-lg">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 bg-[#f6f6f2] flex flex-col justify-center items-start p-6 sm:p-8 lg:p-12 xl:p-20">
          <div className="text-6xl sm:text-7xl lg:text-9xl leading-1 my-6 sm:my-8 lg:my-10">＊</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 flex items-center gap-4">
            Hello<br />MSMEs!<span className="text-3xl sm:text-4xl lg:text-5xl">👋🏻</span>
          </h1>
          <p className="text-gray-600 mt-4 sm:mt-6 mb-0 text-base sm:text-lg lg:text-xl">
            Skip repetitive and manual sales-marketing tasks. Get highly productive through automation and save tons of time!
          </p>
          {/* <div className="mt-auto text-xs sm:text-sm text-gray-400 pt-12 sm:pt-16 lg:pt-24">© 2022 MSMEs. All rights reserved.</div> */}
        </div>
        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 xl:p-20">
          <div className="w-full max-w-md">
            <div className="text-3xl sm:text-4xl font-semibold mb-3 sm:mb-4 text-center">MSMEs</div>
            <div className="text-xl sm:text-2xl font-bold mb-2 text-center">Welcome Back!</div>
            <div className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-10 text-center">
              Don&apos;t have an account? <a href="add-business" className="underline font-medium hover:text-primary">Register your business.</a>.<br />It&apos;s FREE! Takes Few minutes.
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              <input
                type="email"
                name="email_address"
                placeholder="Email"
                value={formData.email_address}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-black mb-2 text-base sm:text-lg"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-black mb-4 sm:mb-6 text-base sm:text-lg"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-primary text-white rounded-lg py-2.5 sm:py-3 font-semibold text-base sm:text-lg mb-2 hover:bg-primary/90 transition-colors ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Logging in..." : "Login Now"}
              </button>
            </form>
            <div className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-4">
              Forget password? <a href="/forget-password" className="underline font-medium hover:text-primary">Click here</a>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 text-center mt-2">
              Login as admin? <a href="/admin-login" className="underline font-medium hover:text-primary">Click here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login