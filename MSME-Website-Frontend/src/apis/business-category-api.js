import instance from "@/utils/axios-instanse";

export const getBusinessCategories = async (searchTerm) => {
  const response = await instance.get(`/business-category/list?search=${searchTerm}`);
  return response.data;
};

export const getBusinessCategoryList = async (page, limit) => {
  const response = await instance.get(`/business-category/list?page=${page}&limit=${limit}`);
  return response.data;
};

export const getSearchCategory = async (searchTerm) => {
  const response = await instance.get(`/business-category/search_by_name?search=${searchTerm}`);
  return response.data;
};

export const addBusinessCategory = async (name, created_by) => {
  const payload = { name, created_by };
  const response = await instance.post(`/business-category/add`, payload);
  return response.data;
};

export const getBusinessSubCategoryList = async (categoryId) => {
  const response = await instance.get(`/business-sub-category/list-according-to-business-id/${categoryId}`);
  return response.data;
};

export const getBusinessListByCategoryId = async (categoryId, page, limit) => {
  const response = await instance.get(`/msme-business/list-according-category-id-v2/${categoryId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const getBusinessListByKeyword = async (keyword) => {
  const response = await instance.get(`/msme-business/search-by-name/${encodeURIComponent(keyword)}`);
  return response.data;
};

export const getBusinessListByregion = async (region) => {
  const response = await instance.get(`/msme-business/search-by-region/${encodeURIComponent(region)}`);
  return response.data;
};

/**
 * Fetch businesses with advanced filters
 * @param {Object} filters - Filter object from frontend state
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Results per page (default 20)
 * @returns {Promise<Object>} - { values: { rows, count }, total }
 */
export const getBusinessListfilter = async (filters = {}, page = 1, limit = 20) => {
  // Map frontend filter names to backend query parameter names
  const params = new URLSearchParams();
  
  // Pagination
  params.append('page', page);
  params.append('limit', limit);
  
  // Category filters
  if (filters.category) params.append('business_category_id', filters.category);
  if (filters.subCategory) params.append('business_sub_category_id', filters.subCategory);
  
  // Location filters
  if (filters.region) params.append('region', filters.region);
  if (filters.inkhundla) params.append('inkhundla', filters.inkhundla);
  if (filters.town) params.append('town', filters.town);
  if (filters.ruralUrbanClassification) params.append('rural_urban_classification', filters.ruralUrbanClassification);
  
  // Business characteristics
  if (filters.numberOfEmployees) params.append('employees', filters.numberOfEmployees);
  if (filters.yearOfEstablishment) params.append('establishment_year', filters.yearOfEstablishment);
  if (filters.turnover) params.append('turnover', filters.turnover);
  if (filters.businessType) params.append('business_type', filters.businessType);
  if (filters.isDisabilityOwned) params.append('disability_owned', filters.isDisabilityOwned);
  
  // Ownership filters
  if (filters.ownershipType) params.append('ownership_type', filters.ownershipType);
  if (filters.ownership) params.append('ownerType', filters.ownership);
  if (filters.ownerGender) params.append('owner_gender', filters.ownerGender);
  
  // Keyword search (multi-field search on backend)
  if (filters.keyword) params.append('keyword', filters.keyword.trim());
  
  // Sorting
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await instance.get(`/msme-business/filters?${params.toString()}`);
  return response.data;
};

/**
 * Advanced keyword search using the filters API
 * Searches across 17+ fields: name, description, products, services, location, etc.
 * @param {string} keyword - Search term(s)
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} - Search results with pagination
 */
export const searchBusinesses = async (keyword, page = 1, limit = 20) => {
  return getBusinessListfilter({ keyword }, page, limit);
};

/**
 * Get autocomplete suggestions as user types
 * Returns business names, categories, locations, services
 * @param {string} query - Search query (min 2 characters)
 * @param {number} limit - Max results per category (default 5)
 * @returns {Promise<Object>} - { suggestions: [...], query: string }
 */
export const getAutocompleteSuggestions = async (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return { suggestions: [] };
  }
  const response = await instance.get(`/msme-business/autocomplete?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
  return response.data;
};

/**
 * Get popular search suggestions
 * Returns top categories and locations by business count
 * @returns {Promise<Object>} - { categories: [...], locations: [...] }
 */
export const getPopularSearches = async () => {
  const response = await instance.get(`/msme-business/popular-searches`);
  return response.data;
};
