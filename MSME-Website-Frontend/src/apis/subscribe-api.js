import instance from "@/utils/axios-instanse";

export const getSubscribe = async () => {
  const response = await instance.get(`/subscribe/list`);
  return response.data;
};

export const createSubscribe = async (subscribe) => {
  const payload = {
    email: subscribe.email,
  };
  const response = await instance.post(`/subscribe/add`, payload);
  return response.data;
}