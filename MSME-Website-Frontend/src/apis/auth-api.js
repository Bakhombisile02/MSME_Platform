import instance from "@/utils/axios-instanse";

export const loginUser = async (email_address, password) => {
  try {
    const payload = {
      email_address,
      password
    }
    const response = await instance.post(`/msme-business/login`, payload);

    if (response.status != 200) {
      throw new Error('Login failed');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}