import instance from "../utils/axios";

// Upload File for partners-logo image
const uploadPartners = async (file) => {
  console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/partners-logo-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create partners-logo
const createPartners = async (data) => {
  const payload = {
    name: data.name,
    icon_url:data.icon_url,
    url: data.url,
  };
  console.log("payload",payload)
  const response = await instance.post("partners-logo/add", payload);
  return response;
};

// Get partners-logo
const getPartners = async (page, limit) => {
  try {
    const response = await instance.get(`partners-logo/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Partners:", error);
    throw error;
  }
};
 
// Delete partners-logo
const removePartners = async (id) => {
  console.log(id)
  const response = await instance.put(`partners-logo/delete/${id}`);
  return response;
};

// Update partners-logo
const updatePartners = async (id, data) => {
  const payload = {
    name: data.name,
    icon_url:data.icon_url,
    url: data.url,
  };
  const response = await instance.put(`partners-logo/update/${id}`, payload);
  return response;
};

export {
  createPartners,
  uploadPartners,
  getPartners,
  updatePartners,
  removePartners,
};
