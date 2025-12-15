import instance from "../utils/axios";


 
 
// Get MSME Business Data
const getMsmeBusinessData = async (data,page, limit) => {
  try {
    // Ensure data is always a valid number, default to 0 if undefined/null
    const filterValue = data !== undefined && data !== null ? data : 0;
    console.log('Filter value:', filterValue);
    const response = await instance.get(`msme-business/list-web/${filterValue}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch MSME business:", error);
    throw error;
  }
};

// Get MSME Business Detail Data
const getMsmeBusinessDetailData = async (id) => {
  try {
    const response = await instance.get(`msme-business/msme-details/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    throw error;
  }
};

// Get MSME Business Detail Data
const updateMsmeBusinessStatueData = async (email,newStatus,id,data) => {
  const payload={
    is_verified:newStatus,
    email_address:email,
    is_verified_comments:data
  }
  try {
    const response = await instance.put(`msme-business/verify-msme/${id}`,payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    throw error;
  }
};
// Delete MSME Business Data
const removeMsmeBusinessData = async (id) => {
  console.log(id)
  const response = await instance.put(`msme-business/delete/${id}`);
  return response;
};


// Get MSME Business Detail Data
const rejectMsmeBusinessStatueData = async (data,id) => {
  const payload={
    is_verified_comments:data,
  }
  console.log("payload",payload)
  try {
    const response = await instance.put(`msme-business/verify-msme/${id}`,payload);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    throw error;
  }
};

export {
  getMsmeBusinessData,
  getMsmeBusinessDetailData,
  removeMsmeBusinessData,
  updateMsmeBusinessStatueData,
  rejectMsmeBusinessStatueData
};
