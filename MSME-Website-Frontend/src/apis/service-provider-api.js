import instance from "@/utils/axios-instanse";

export const getServiceProviderList = async (page, limit) => {
  const response = await instance.get(`/service-providers/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getServiceProviderCategoryList = async (page, limit) => {
  const response = await instance.get(`/service-provider-category/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getServiceProviderbyID = async (id,page, limit) => {
  const response = await instance.get(`/service-providers/list/${id}?page=${page}&limit=${limit}`);
  console.log(response)
  return response.data;
}

export const getSearchServiceCategory = async (search,page, limit) => {
  const response = await instance.get(`/service-provider-category/search_by_name?page=${page}&limit=${limit}&name=${search}`);
  console.log(response)
  return response.data;
}
export const getSearchServiceProvider = async (search,page, limit) => {
  const response = await instance.get(`/service-providers/search_by_name?page=${page}&limit=${limit}&name=${search}`);
  console.log(response)
  return response.data;
}