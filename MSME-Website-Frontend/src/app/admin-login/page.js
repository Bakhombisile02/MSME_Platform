"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginAdmin } from '@/apis/admin-auth-api';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginAdmin(formData.email, formData.password);
      
      // Extract user type from response
      const userType = response.admin?.user_type || 'admin';
      
      // Store auth data
      login(response.admin.id, response.token, userType);
      
      toast.success("Admin logged in successfully!");
      router.push('/');
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || err.response.data?.error || 'Login failed. Please check your credentials.';
        setError(message);
        toast.error(message);
      } else if (err.request) {
        setError('No response from server. Please check your internet connection.');
        toast.error('Network error. Please try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-[80rem] bg-white flex flex-col lg:flex-row overflow-hidden rounded-lg shadow-lg">
        {/* Left Section */}
        <div className="w-full lg:w-1/2 bg-[#f6f6f2] flex flex-col justify-center items-start p-6 sm:p-8 lg:p-12 xl:p-20">
          <div className="text-6xl sm:text-7xl lg:text-9xl leading-1 my-6 sm:my-8 lg:my-10">✱</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 flex items-center gap-4">
            Admin<br />Portal
            <span className="text-3xl sm:text-4xl lg:text-5xl">🔐</span>
          </h1>
          <p className="text-gray-600 mt-4 sm:mt-6 mb-0 text-base sm:text-lg lg:text-xl">
            Access the administrative dashboard to manage MSME registrations, verify businesses, 
            and oversee platform operations. Secure access for authorized administrators only.
          </p>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 xl:p-20">
          <div className="w-full max-w-md">
            <div className="text-3xl sm:text-4xl font-semibold mb-3 sm:mb-4 text-center">Admin</div>
            <div className="text-xl sm:text-2xl font-bold mb-2 text-center">Welcome Back!</div>
            <div className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-10 text-center">
              Not an admin? <a href="/login" className="underline font-medium hover:text-primary">Login as MSME</a>.
              <br />Access the main platform for business users.
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              <input
                placeholder="Admin Email"
                className="border border-gray-300 rounded-lg px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-black mb-2 text-base sm:text-lg"
                required
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                name="email"
              />
              <input
                placeholder="Password"
                className="border border-gray-300 rounded-lg px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-black mb-4 sm:mb-6 text-base sm:text-lg"
                required
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                name="password"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-primary text-white rounded-lg py-2.5 sm:py-3 font-semibold text-base sm:text-lg mb-2 hover:bg-primary/90 transition-colors ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Logging in..." : "Login as Admin"}
              </button>
            </form>
            <div className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-4">
              Forget password? <a href="/forget-password" className="underline font-medium hover:text-primary">Click here</a>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 text-center mt-2">
              Login as MSME? <a href="/login" className="underline font-medium hover:text-primary">Click here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin