import instance from "../utils/axios";

// ==================== TICKETS ====================

// Get all tickets with filters
export const getTickets = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params.is_read !== undefined) queryParams.append('is_read', params.is_read);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await instance.get(`/contact/list?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    throw error;
  }
};

// Get tickets assigned to current admin
export const getMyTickets = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await instance.get(`/contact/my-tickets?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch my tickets:", error);
    throw error;
  }
};

// Get single ticket detail
export const getTicketDetail = async (id) => {
  try {
    const response = await instance.get(`/contact/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch ticket detail:", error);
    throw error;
  }
};

// Update ticket (status, priority, assignment, category)
export const updateTicket = async (id, data) => {
  try {
    const response = await instance.put(`/contact/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update ticket:", error);
    throw error;
  }
};

// Delete ticket
export const deleteTicket = async (id) => {
  try {
    const response = await instance.delete(`/contact/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete ticket:", error);
    throw error;
  }
};

// ==================== RESPONSES ====================

// Add response to ticket
export const addTicketResponse = async (ticketId, data) => {
  try {
    const response = await instance.post(`/contact/respond/${ticketId}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to add response:", error);
    throw error;
  }
};

// Get responses for a ticket
export const getTicketResponses = async (ticketId, includeInternal = true) => {
  try {
    const response = await instance.get(`/contact/responses/${ticketId}?include_internal=${includeInternal}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch responses:", error);
    throw error;
  }
};

// ==================== STATS ====================

// Get help desk dashboard stats
export const getHelpDeskStats = async () => {
  try {
    const response = await instance.get('/contact/stats');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    throw error;
  }
};

// ==================== CATEGORIES ====================

// Get all categories (admin - with stats)
export const getTicketCategories = async () => {
  try {
    const response = await instance.get('/contact/categories/admin');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};

// Create category
export const createTicketCategory = async (data) => {
  try {
    const response = await instance.post('/contact/categories', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error;
  }
};

// Update category
export const updateTicketCategory = async (id, data) => {
  try {
    const response = await instance.put(`/contact/categories/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update category:", error);
    throw error;
  }
};

// Delete category
export const deleteTicketCategory = async (id) => {
  try {
    const response = await instance.delete(`/contact/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
};

// ==================== ADMINS ====================

// Get admins for assignment dropdown
export const getAdmins = async () => {
  try {
    const response = await instance.get('/contact/admins');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    throw error;
  }
};
