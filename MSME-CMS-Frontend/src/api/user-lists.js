import instance from "../utils/axios";

// Get list of Registered Users
const getRegisterUserList = async (page , limit ) => {
  try {
    const response = await instance.get(
      `user/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Reported Incidents:", error);
    throw error;
  }
};

const getContactList = async (page , limit ) => {
  try {
    const response = await instance.get(
      `/contact/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Reported Incidents:", error);
    throw error;
  }
};

const getSubscriberList = async (page , limit ) => {
  try {
    const response = await instance.get(
      `subscribe/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Reported Incidents:", error);
    throw error;
  }
};


const getfeedbackList = async (page , limit ) => {
  try {
    const response = await instance.get(
      `/feedback/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Reported Incidents:", error);
    throw error;
  }
};

const getMsmeListByCategory = async () => {
  try {
    const response = await instance.get(
      `/dashboard/msme_list_according_to_category`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch MSME By Category:", error);
    throw error;
  }
};

const getMsmeListByCategoryId = async ({msme_category_id}) => {
  try {
    const response = await instance.get(
      `/msme-business/list-according-category-id-v2/${msme_category_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch MSME By Category:", error);
    throw error;
  }
};

const getServiceProviderListByCategory = async () => {
  try {
    const response = await instance.get(
      `/dashboard/service_provider_list_according_to_category`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch MSME By Category:", error);
    throw error;
  }
};

const getServiceProviderListByCategoryId = async ({id}) => {
  try {
    const response = await instance.get(`/service-providers/list/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch MSME By Category:", error);
    throw error;
  }
};

export { 
  getRegisterUserList,
  getSubscriberList, 
  getfeedbackList,
  getContactList, 
  getMsmeListByCategory, 
  getMsmeListByCategoryId, 
  getServiceProviderListByCategory, 
  getServiceProviderListByCategoryId
};
