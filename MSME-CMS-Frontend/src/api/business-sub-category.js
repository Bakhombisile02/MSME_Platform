import instance from "../utils/axios";

// Create business sub category
const createbusinessSubCategory = async ( data ) => {
  const payload = {
    name: data.name,
    BusinessCategorieId: data.BusinessCategorieId,
    BusinessCategorieName: data.BusinessCategorieName,
  };
  // console.log("payload",payload)
  const response = await instance.post( "business-sub-category/add", payload );
  return response;
};

// Get business sub category
const getbusinessSubCategory = async ( page, limit ) => {
  try {
    const response = await instance.get( `business-sub-category/list?page=${page}&limit=${limit}` );
    return response.data;
  } catch ( error ) {
    console.error( "Failed to fetch Seasonal business:", error );
    throw error;
  }
};

// Delete business sub category
const removebusinessSubCategory = async ( id ) => {
  console.log( id )
  const response = await instance.put( `business-sub-category/delete/${id}` );
  return response;
};

// Update business sub category
const updatebusinessSubCategory = async ( id, data ) => {
  const payload = {
    name: data.name,
    BusinessCategorieId: data.BusinessCategorieId,
    BusinessCategorieName: data.BusinessCategorieName,
  };
  const response = await instance.put( `business-sub-category/update/${id}`, payload );
  return response;
};

export {
  createbusinessSubCategory,
  getbusinessSubCategory,
  updatebusinessSubCategory,
  removebusinessSubCategory,
};
