import instance from "../utils/axios";

// Upload File for teamMember-logo image
const uploadteamMember = async (file) => {
  console.log("this is ",file)
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData)
  const response = await instance.post("/upload/team-member-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data", 
    },
  });  return response;
};

// Create teamMember-logo
const createteamMember = async (data) => {
  const payload = {
    name: data.name,
    url:data.icon_url,
    possition: data.position,
  };
  console.log("payload",payload)
  const response = await instance.post("team/add", payload);
  return response;
};

// Get teamMember-logo
const getteamMember = async (page, limit) => {
  try {
    const response = await instance.get(`team/list?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch teamMember:", error);
    throw error;
  }
};
 
// Delete teamMember-logo
const removeteamMember = async (id) => {
  console.log(id)
  const response = await instance.put(`team/delete/${id}`);
  return response;
};

// Update teamMember-logo
const updateteamMember = async (id, data) => {
  const payload = {
    name: data.name,
    url:data.icon_url,
    possition: data.position,
  };
  const response = await instance.put(`team/update/${id}`, payload);
  return response;
};

export {
  createteamMember,
  uploadteamMember,
  getteamMember,
  updateteamMember,
  removeteamMember,
};
