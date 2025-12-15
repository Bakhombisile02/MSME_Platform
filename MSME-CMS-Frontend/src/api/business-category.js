import instance from "../utils/axios";

// Upload File for business category image
const uploadbusinessCategory = async (file) => {
  console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/business-categories-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create business category
const createbusinessCategory = async (data) => {
  const payload = {
    name: data.name,
    icon_url:data.url,
  };
  console.log("payload",payload)
  const response = await instance.post("business-category/add", payload);
  return response;
};

// Get business category
const getbusinessCategory = async (page, limit) => {
  try {
    const response = await instance.get(`business-category/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Seasonal business:", error);
    throw error;
  }
};
 
// Delete business category
const removebusinessCategory = async (id) => {
  console.log(id)
  const response = await instance.put(`business-category/delete/${id}`);
  return response;
};

// Update business category
const updatebusinessCategory = async (id, data) => {
  const payload = {
    name: data.name,
    icon_url:data.url,
  };
  const response = await instance.put(`business-category/update/${id}`, payload);
  return response;
};

export {
  createbusinessCategory,
  uploadbusinessCategory,
  getbusinessCategory,
  updatebusinessCategory,
  removebusinessCategory,
};
