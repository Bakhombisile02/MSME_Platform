import { useState } from "react";
import { loginUser } from "../../api/auth-user";
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(data);
      console.log("clg",res)
      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Login successful!",
          text: "Welcome back!",
        }).then(() => {
          navigate("/");  
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login failed",
          text: res?.data?.error || "Invalid credentials",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.error || error.message || "Something went wrong!",
      });
    }
  };
  
  
  

  return (
    <div 
  className="flex items-center justify-center min-h-screen bg-no-repeat"
  style={{
    backgroundImage: 'url("/assets/25Images03.jpg")',
    backgroundSize: '100% 100%',
    backgroundColor: '#f5f5f5'
  }}
>
      {/* Your content here */}
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-100">
      {/* Header with improved gradient */}
      <div className="bg-primary-950 text-white rounded-lg py-5 px-6 text-center mb-6 shadow-sm">
        <h2 className="text-2xl font-bold">MSME CMS</h2>
        <p className="text-blue-100 text-sm mt-1">Sign in to your account</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              placeholder="you@example.com"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Password</label>
          </div>
          <div className="relative">
            <input
              type="password"
              name="password"
              value={data.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Remember Me
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-primary-950 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign In
        </button>

        {/* Sign Up Link */}

      </form>
    </div>
    </div>
  );
};

export default Login;