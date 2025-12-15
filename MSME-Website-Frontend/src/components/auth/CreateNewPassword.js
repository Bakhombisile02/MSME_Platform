import { useRouter } from "next/navigation";
import { useState } from "react";
import { createNewPassword } from "@/apis/forget-password-api";
import toast from "react-hot-toast";

const CreateNewPassword = ({ email, resetToken, onBack }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await createNewPassword({
        email,
        password: formData.password,
        reset_token: resetToken, // Include reset token for secure password reset
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Password reset successful!");
        router.push('/login');
      } else {
        setError(response.message || 'Failed to reset password');
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
            3
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Password</h3>
          <p className="text-sm text-gray-500">Choose a password to secure your account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary/80 focus:border-primary/80 sm:text-sm"
              placeholder="Enter new password (min. 6 characters)"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary/80 focus:border-primary/80 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {error && (
          <div className="text-secondary text-sm mt-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Back to verification
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNewPassword