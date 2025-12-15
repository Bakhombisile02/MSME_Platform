import instance from "@/utils/axios-instanse";

export const getFeedback = async () => {
  const response = await instance.get(`/feedback/list`);
  return response.data;
};

export const createFeedback = async (feedback) => {
  const payload = {
    feedbackType: feedback.feedbackType,
    name: feedback.name,
    mobile: feedback.mobile,
    email: feedback.email,
    message: feedback.message
  };
  const response = await instance.post(`/feedback/add`, payload);
  return response.data;
}