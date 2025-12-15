'use client';

import { useState, useEffect } from 'react';
import CreateNewPassword from '@/components/auth/CreateNewPassword';
import { sendEmail, verifyCode } from '@/apis/forget-password-api';
import toast from 'react-hot-toast';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(''); // Store reset token from OTP verification
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [showNewPasswordSection, setShowNewPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
  };

  const handleForgetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await sendEmail(email);
      
      if (response.status === 200 || response.status === 201) {
        toast.success('Verification code sent to your email!');
        setShowOtpSection(true);
        startTimer();
      } else {
        setError(response.message || 'Something went wrong');
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setError('');
    setLoading(true);

    try {
      const response = await sendEmail(email);
      
      if (response.status === 200 || response.status === 201) {
        toast.success('Verification code resent to your email!');
        startTimer();
      } else {
        setError(response.message || 'Something went wrong');
        toast.error(response.message || 'Failed to resend verification code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to resend verification code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyCode({ email, otp });
      
      if (response.status === 200 || response.status === 201) {
        toast.success('OTP verified successfully!');
        // Store the reset token from response for password reset
        if (response.data?.reset_token) {
          setResetToken(response.data.reset_token);
        }
        setShowNewPasswordSection(true);
      } else {
        setError(response.message || 'Invalid OTP');
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[url('/images/forget_password/bg.png')] bg-cover bg-center h-screen w-full flex flex-col justify-center pb-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Forgot Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-8">
            {/* Step 1: Email Section */}
            {!showNewPasswordSection && (
              <div className="space-y-6">
                <div className="">
                  <h3 className="text-lg font-medium text-gray-900">Enter your email</h3>
                  <p className="text-sm text-gray-500">We&apos;ll send you a verification code</p>
                </div>

                <form onSubmit={handleForgetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        disabled={loading || showOtpSection}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary/80 focus:border-primary/80 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {error && !showOtpSection && (
                    <div className="text-secondary text-sm mt-2">
                      {error}
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={loading || showOtpSection}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send Code'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: OTP Section */}
            {showOtpSection && !showNewPasswordSection && (
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                      2
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Enter verification code</h3>
                    <p className="text-sm text-gray-500">Check your email for the code</p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                      Verification code
                    </label>
                    <div className="mt-1">
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary/80 focus:border-primary/80 sm:text-sm"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
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
                      onClick={() => setShowOtpSection(false)}
                      className="text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Change email
                    </button>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={!canResend || loading}
                        className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Create New Password Section */}
            {showNewPasswordSection && (
              <CreateNewPassword
                email={email}
                resetToken={resetToken}
                onBack={() => setShowNewPasswordSection(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword