import instance from "../utils/axios";


// Upload File for DownloadNew Data image
const uploadDownloadNewData = async (file) => {
    console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/downloads/", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create DownloadNew Data
const createDownloadNewData = async (data) => {

  console.log("payload",data)
  const response = await instance.post("downloads/add", data);
  return response;
};

// Get DownloadNew Data
const getDownloadNewData = async (page, limit) => {
  try {
    const response = await instance.get(`downloads/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch downloads:", error);
    throw error;
  }
};
 
// Delete DownloadNew Data
const removeDownloadNewData = async (id) => {
  console.log(id)
  const response = await instance.put(`downloads/delete/${id}`);
  return response;
};

// Update DownloadNew Data
const updateDownloadNewData = async (id, data) => {
  console.log("payload",data)

  const response = await instance.put(`downloads/update/${id}`, data);
  return response;
};

export {
  createDownloadNewData,
  uploadDownloadNewData,
  getDownloadNewData,
  updateDownloadNewData,
  removeDownloadNewData,
};
