import instance from "../utils/axios";

// FAQ Create
const createFaq = async ( {question, answer} ) => {
  const response = await instance.post( "faq/add", {question, answer} );
  return response;
};

// Get list of FAQ
const getFaqList = async (page , limit) => {
  try {
    const response = await instance.get(
      `faq/list?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    throw error;
  }
};

// Delete faq by id
const removeFaq=async(id)=>{
  const response = await instance.put(
      `faq/delete/${id}`, 
    );
    return response;
}

// Update FAQ by id
const updateFaq=async( id, data ) => {
  const response = await instance.put(
      `faq/update/${id}`, 
      {
        question:data.question,
        answer:data.answer
      },
    );
    return response;
}

export { createFaq, getFaqList, updateFaq, removeFaq };
