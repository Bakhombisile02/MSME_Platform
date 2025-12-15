import instance from "@/utils/axios-instanse";

/**
 * Request OTP for password reset
 * Uses the new secure POST endpoint
 */
export const sendEmail = async (email) => {
  const response = await instance.post(`/msme-business/forget-password/request-otp`, {
    email_address: email
  });
  return response;
};

/**
 * Verify OTP code
 * Uses the new secure POST endpoint that returns a reset token
 */
export const verifyCode = async (data) => {
  const response = await instance.post(`/msme-business/forget-password/verify-otp`, {
    email_address: data.email,
    otp: data.otp
  });
  console.log("response", response.status);
  return response;
};

/**
 * Create new password
 * Uses the new secure POST endpoint with reset token
 */
export const createNewPassword = async (data) => {
  const response = await instance.post(`/msme-business/forget-password/reset`, {
    email_address: data.email,
    password: data.password,
    reset_token: data.reset_token
  });
  return response;
};

// =============================================================================
// LEGACY API FUNCTIONS - Deprecated, kept for backwards compatibility
// =============================================================================

/**
 * @deprecated Use sendEmail instead
 */
export const sendEmailLegacy = async (email) => {
  const response = await instance.put(`/msme-business/forget-password-send-otp/${email}`);
  return response;
};

/**
 * @deprecated Use verifyCode instead
 */
export const verifyCodeLegacy = async (data) => {
  const response = await instance.put(`/msme-business/forget-password-otp-verify/${data.email}/${data.otp}`);
  return response;
};

/**
 * @deprecated Use createNewPassword instead
 */
export const createNewPasswordLegacy = async (data) => {
  const response = await instance.put(`/msme-business/forget-password/${data.email}/${data.password}`);
  return response;
};