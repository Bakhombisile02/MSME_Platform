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
      
      // Dispatch storage event so ProtectedLayout detects the change
      window.dispatchEvent(new Event('storage'));

      // Show popup with auto-close timer
      let timerInterval;
      await Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        html: 'Your session has expired. Redirecting to login in <b>3</b> seconds...',
        timer: 3000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          const b = Swal.getHtmlContainer().querySelector('b');
          timerInterval = setInterval(() => {
            const timeLeft = Math.ceil(Swal.getTimerLeft() / 1000);
            b.textContent = timeLeft;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      });

      // Reset flag and redirect
      isHandlingUnauthorized = false;
      window.location.href = '/login';
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
