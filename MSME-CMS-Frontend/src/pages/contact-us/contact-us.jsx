import React, { useEffect, useState } from 'react';
import { getContactList } from '../../api/user-lists';

const Contactus = () => {
  const [contactUSData, setContactUsData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [totalData,setTotalData]=useState(0);
  const limit = 10;

  const fetchContact = async (page, limit) => {
    try {
      const data = await getContactList(page, limit);
      setContactUsData(data?.values?.rows || []);
      setTotalData(data.total);
      setTotalPages(data?.total_pages || 1);
    } catch (err) {
      console.error("Error fetching feedback", err);
    }
  };

  useEffect(() => {
    fetchContact(page, limit);
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  // Utility to get first N words of a message
  const getFirstWords = (text, wordCount) => {
    const words = text.split(" ");
    return words.slice(0, wordCount).join(" ") + (words.length > wordCount ? "..." : "");
  };

  // Handle opening the modal with full message
  const openModal = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const closeModal = () => {
    setSelectedFeedback(null);
  };

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Contact Us</span>
      </div>
      <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6   flex justify-between items-center">
        Contact Us
        <div className="text-sm">
            <span> {totalData} Entries Found </span>
          </div>
      </div>
      <div className="bg-white shadow-lg  text-primary-950 pb-5 overflow-x-auto text-sm ">
          <table className="min-w-full text-sm ">
            <thead className="bg-primary-950/5 py-5">
              <tr className="text-left text-sm font-semibold  text-primary-950 border-b border-primary-950/10">
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Name</th>
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Email ID</th>
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Phone</th>
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Subject</th>
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y text-primary-950  divide-gray-200">
            {contactUSData.length > 0 ? (
              contactUSData.map((feedback, index) => (
                <tr key={index} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openModal(feedback)}>
                  <td className="py-3 px-4  ">{feedback.name}</td>
                  <td className="py-3 px-4  ">{feedback.email}</td>
                  <td className="py-3 px-4  ">{feedback.mobile}</td>
                  <td className="py-3 px-4  "> {getFirstWords(feedback.subject, 3)}</td>
                  <td className="py-3 px-4  ">
                    {getFirstWords(feedback.message, 3)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center px-4 py-6 text-gray-500">
                  No Contact US.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Previous
        </button>
        <span className="text-primary-950 font-medium">Page {page} of {totalPages}</span>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Next
        </button>
      </div>

      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            {/* Close Button (Top-right) */}
            <button
              className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={closeModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Contact Us Detail</h2>
                <div className="w-12 h-1 bg-accent-500 mt-2 rounded-full"></div>
            </div>

            {/* Sender Info (Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">From</p>
                <p className="text-gray-800 font-medium">{selectedFeedback.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p className="text-gray-800 font-medium">{selectedFeedback.mobile}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-800 font-medium break-all">{selectedFeedback.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Subject </p>
                <p className="text-gray-800 font-medium capitalize">{selectedFeedback.subject}</p>
              </div>
            </div>

            {/* Feedback Message */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Message</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                {selectedFeedback.message}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Contactus;
