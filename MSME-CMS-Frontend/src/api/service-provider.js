import instance from "../utils/axios";

// Upload File for Service Provider image
const uploadServiceProvider = async (file) => {
  console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/service-providers-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create Service Provider
const createServiceProvider = async (data) => {
 
  console.log("payload",data)
  const response = await instance.post("service-providers/add", data);
  return response;
};

// Get Service Provider
const getServiceProvider = async (page, limit) => {
  try {
    const response = await instance.get(`service-providers/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Seasonal Service:", error);
    throw error;
  }
};
 
// Delete Service Provider
const removeServiceProvider = async (id) => {
  console.log(id)
  const response = await instance.put(`service-providers/delete/${id}`);
  return response;
};

// Update Service Provider
const updateServiceProvider = async (id, data) => {
 
  const response = await instance.put(`service-providers/update/${id}`, data);
  return response;
};

export {
  createServiceProvider,
  uploadServiceProvider,
  getServiceProvider,
  updateServiceProvider,
  removeServiceProvider,
};
