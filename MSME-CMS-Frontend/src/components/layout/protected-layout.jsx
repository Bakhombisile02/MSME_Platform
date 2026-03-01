import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './sidebar/sidebar'
import { useAuth } from '../../context/FirebaseAuthContext';

const ProtectedLayout = () => {
  const { admin, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-white">
      <Sidebar />
      <div className="md:pl-[17rem] mt-12 md:mt-0">
        <div className='bg-gray-100 min-h-screen'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default ProtectedLayout