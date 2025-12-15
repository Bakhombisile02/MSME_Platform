import instance from "@/utils/axios-instanse";

export const createContact = async (contact) => {
  const payload = {
    name: contact.name,
    mobile: contact.mobile,
    email: contact.email,
    subject: contact.subject,
    message: contact.message,
  };
  const response = await instance.post(`/contact/add`, payload);
  return response.data;
}