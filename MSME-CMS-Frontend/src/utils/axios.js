import axios from "axios";
import Swal from "sweetalert2";

let isHandlingUnauthorized = false; // Global Unauthorized flag

// create instance for calling api
const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true; 

      // Clear stored auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminData');

      const result = await Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again.',
        confirmButtonText: 'Go to Login',
        allowOutsideClick: false,
      });

      // Reset flag before redirect so future requests work
      isHandlingUnauthorized = false;

      if (result.isConfirmed) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// On every request, try to attach token if it exists
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
