import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './sidebar/sidebar'
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';

const ProtectedLayout = () => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  // Check for token changes (e.g., when 401 removes it)
  const checkToken = useCallback(() => {
    const currentToken = localStorage.getItem("authToken");
    if (currentToken !== token) {
      setToken(currentToken);
    }
  }, [token]);

  // Listen for storage events (when token is removed by axios interceptor)
  useEffect(() => {
    // Check token periodically and on focus
    const interval = setInterval(checkToken, 1000);
    window.addEventListener('focus', checkToken);
    window.addEventListener('storage', checkToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkToken);
      window.removeEventListener('storage', checkToken);
    };
  }, [checkToken]);

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Unauthorized Access',
        text: 'You must be logged in to access this page.',
        confirmButtonText: 'Go to Login',
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          setShouldRedirect(true);
        }
      });
    }
  }, [token]);

  if (!token && shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-white">
      <Sidebar />
      <div className="md:pl-[17rem]   mt-12 md:mt-0">
        <div className='bg-gray-100 min-h-screen'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default ProtectedLayout