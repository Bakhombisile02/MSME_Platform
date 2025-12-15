import instance from "@/utils/axios-instanse";

export const getLists = async (page, limit) => {
  const response = await instance.get(`/lists?page=${page}&limit=${limit}`);
  return response.data;
};

export const getHomeSliderList = async (page, limit) => {
  const response = await instance.get(`/home-banner/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getPartnersLogoList = async (page, limit) => {
  const response = await instance.get(`/partners-logo/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getTeamMembersList = async (page, limit) => {
  const response = await instance.get(`/team/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getFaqList = async (page, limit) => {
  const response = await instance.get(`/faq/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getDownloadList = async (page, limit) => {
  const response = await instance.get(`/downloads/list?page=${page}&limit=${limit}`);
  return response.data;
};
