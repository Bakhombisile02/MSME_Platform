import instance from "@/utils/axios-instanse";

export const createContact = async (contact) => {
  const payload = {
    name: contact.name,
    mobile: contact.mobile,
    email: contact.email,
    subject: contact.subject,
    message: contact.message,
    category_id: contact.category_id,
    priority: contact.priority,
  };
  const response = await instance.post(`/contact/add`, payload);
  return response.data;
};

// Get ticket categories for contact form
export const getTicketCategories = async () => {
  const response = await instance.get(`/contact/categories`);
  return response.data;
};

// Track ticket status
export const trackTicket = async (ticketId, email) => {
  const response = await instance.post(`/contact/track`, {
    ticket_id: ticketId,
    email: email,
  });
  return response.data;
};

// Submit customer reply to ticket
export const submitCustomerReply = async (ticketId, email, message) => {
  const response = await instance.post(`/contact/reply`, {
    ticket_id: ticketId,
    email: email,
    message: message,
  });
  return response.data;
};

// Submit satisfaction rating
export const submitSatisfactionRating = async (ticketId, email, rating, feedback) => {
  const response = await instance.post(`/contact/rating`, {
    ticket_id: ticketId,
    email: email,
    rating: rating,
    feedback: feedback,
  });
  return response.data;
};