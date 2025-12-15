import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './sidebar/sidebar'
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const ProtectedLayout = () => {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const token = localStorage.getItem("authToken");

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
    // return <Navigate to="/login" />;
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