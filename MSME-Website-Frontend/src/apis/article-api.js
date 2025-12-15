import instance from "@/utils/axios-instanse";

export const getArticleList = async (page, limit) => {
  const response = await instance.get(`/blog/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await instance.get(`/blog/list/${id}`);
  return response.data;
};
