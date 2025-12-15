import instance from "../utils/axios";

const getFirst150Words = (html) => {
  const plainText = html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.split(' ').slice(0, 50).join(' ');
};


// Upload File for Banner Data image
const uploadBannerImageData = async (file) => {
    console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/home-banner-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create Banner Data
const createBannerData = async (data) => {

  console.log("payload",data)
  const response = await instance.post("home-banner/add", data);
  return response;
};

// Get Banner Data
const getBannerData = async (page, limit) => {
  try {
    const response = await instance.get(`home-banner/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch home-banner:", error);
    throw error;
  }
};
 
// Delete Banner Data
const removeBannerData = async (id) => {
  console.log(id)
  const response = await instance.put(`home-banner/delete/${id}`);
  return response;
};

// Update Banner Data
const updateBannerData = async (id, data) => {
  console.log("payload",data)

  const response = await instance.put(`home-banner/update/${id}`, data);
  return response;
};

export {
  createBannerData,
  uploadBannerImageData,
  getBannerData,
  updateBannerData,
  removeBannerData,
};
