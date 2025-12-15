import instance from "@/utils/axios-instanse";

export const getBusinessCategories = async (searchTerm) => {
  const response = await instance.get(`/business-category/list?search=${searchTerm}`);
  return response.data;
};

export const getBusinessCategoryList = async (page, limit) => {
  const response = await instance.get(`/business-category/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getSearchCategory = async (searchTerm) => {
  const response = await instance.get(`/business-category/search_by_name?search=${searchTerm}`);
  return response.data;
};

export const addBusinessCategory = async (name, created_by) => {
  const payload = { name, created_by };
  const response = await instance.post(`/business-category/add`, payload);
  return response.data;
};

export const getBusinessSubCategoryList = async (categoryId) => {
  const response = await instance.get(`/business-sub-category/list-according-to-business-id/${categoryId}`);
  return response.data;
};

export const getBusinessListByCategoryId = async (categoryId, page, limit) => {
  const response = await instance.get(`/msme-business/list-according-category-id-v2/${categoryId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const getBusinessListByKeyword = async (keyword) => {
  const response = await instance.get(`/msme-business/search-by-name/${encodeURIComponent(keyword)}`);
  return response.data;
};

export const getBusinessListByregion = async (region) => {
  const response = await instance.get(`/msme-business/search-by-region/${encodeURIComponent(region)}`);
  return response.data;
};

export const getBusinessListfilter = async () => {
  const response = await instance.get(`/msme-business/filters`);
  return response.data;
};
