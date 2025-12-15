import instance from "@/utils/axios-instanse";

export const loginAdmin = async (email, password) => {
  try {
    const payload = {
      email,
      password
    }
    const response = await instance.post(`/admin/login`, payload);

    if (response.status != 200) {
      throw new Error('Login failed');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}