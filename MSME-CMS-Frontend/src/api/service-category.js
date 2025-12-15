import instance from "../utils/axios";

// Upload File for Service category image
const uploadServiceCategory = async (file) => {
  console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/service-provider-categories-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create Service category
const createServiceCategory = async (data) => {
  const payload = {
    name: data.name,
    icon_url:data.url,
    description:data.description
  };
  console.log("payload",payload)
  const response = await instance.post("service-provider-category/add", payload);
  return response;
};

// Get Service category
const getServiceCategory = async (page, limit) => {
  try {
    const response = await instance.get(`service-provider-category/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Seasonal Service:", error);
    throw error;
  }
};
 
// Delete Service category
const removeServiceCategory = async (id) => {
  console.log(id)
  const response = await instance.put(`service-provider-category/delete/${id}`);
  return response;
};

// Update Service category
const updateServiceCategory = async (id, data) => {
  const payload = {
    name: data.name,
    icon_url:data.url,
    description:data.description
  };
  const response = await instance.put(`service-provider-category/update/${id}`, payload);
  return response;
};

export {
  createServiceCategory,
  uploadServiceCategory,
  getServiceCategory,
  updateServiceCategory,
  removeServiceCategory,
};
