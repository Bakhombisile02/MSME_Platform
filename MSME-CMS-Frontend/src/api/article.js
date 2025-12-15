import instance from "../utils/axios";


// Upload File for Article Data image
const uploadArticleImageData = async (file) => {
    console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/blog-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create Article Data
const createArticleData = async (data) => {

  console.log("payload",data)
  const response = await instance.post("blog/add", data);
  return response;
};

// Get Article Data
const getArticleData = async (page, limit) => {
  try {
    const response = await instance.get(`blog/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    throw error;
  }
};
 
// Delete Article Data
const removeArticleData = async (id) => {
  console.log(id)
  const response = await instance.put(`blog/delete/${id}`);
  return response;
};

// Update Article Data
const updateArticleData = async (id, data) => {
  console.log("payload",data)

  const response = await instance.put(`blog/update/${id}`, data);
  return response;
};

export {
  createArticleData,
  uploadArticleImageData,
  getArticleData,
  updateArticleData,
  removeArticleData,
};
