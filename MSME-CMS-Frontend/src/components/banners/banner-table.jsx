import React, { useState } from 'react';
import { sanitizeHTML } from '../../utils/sanitize';

// Base64 encoded small gray placeholder image to avoid network requests
const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23e6e9ee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12px' fill='%23133b5e'%3ENo Image%3C/text%3E%3C/svg%3E";

const BannerTable = ({ data, onEdit, onDelete, page, totalPages, handleNextPage, handlePrevPage, loading }) => {
  const [selectedBanner, setSelectedBanner] = useState(null);

  const openModal = (article) => {
    setSelectedBanner(article);
  };

  const closeModal = () => {
    setSelectedBanner(null);
  };

  return (
    <>
      <div className="bg-[#e6e9ee] shadow-xl  overflow-hidden border border-primary-950/20">
        
        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white/50">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#e6e9ee] border-t-accent-500 rounded-full animate-spin mb-4"></div>
              <p className="text-primary-950 font-medium">Loading data...</p>
            </div>
          </div>
        ) : (
          <>
            {data.length === 0 ? (
              <div className="text-center py-16 bg-white">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto text-primary-950/50 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-primary-950 text-lg font-medium mb-1">No Banner found</h3>
                <p className="text-primary-950/70 mb-6">Add a new Banner to get started</p>
                
              </div>
            ) : (
              <div className="overflow-x-auto bg-white shadow-sm rounded-b-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary-950/5 py-5">
                    <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                      <th className="py-4 pl-6 text-left font-medium tracking-wider">S. No</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider"> Image</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Name</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Description</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Link</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-primary-950/10">
                    {data.map((entry, index) => (
                      <tr key={entry.id}  onClick={() => openModal(entry)} className="cursor-pointer hover:bg-primary-950/5 transition-colors">
                        <td className="py-4 pl-6 font-medium text-primary-950">
                          {index + 1 + (page - 1) * 10}
                        </td>
                        <td className="py-4 pl-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#e6e9ee] border border-primary-950/20 flex-shrink-0 shadow-sm">
                            <img 
                              src={`${import.meta.env.VITE_DOCS_URL}${entry.image_url}`} 
                              alt={entry.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onError = null;
                                e.target.src = placeholderImage;
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-4 pl-3 font-medium text-primary-950">
                          <div className="w-60 truncate" title={entry.name}>
                            {entry.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-primary-950 max-w-[200px] truncate">
                          {(() => {
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = entry.description || '';
                            const plainText = tempDiv.textContent || tempDiv.innerText || '';
                            return plainText;
                          })()}
                        </td>
                        <td className="py-4 pl-3 font-medium text-primary-950">
                          <div className="truncate" >
                            <a target='_blank' href={`${import.meta.env.VITE_DOCS_URL}${entry.url}`} >Link</a>
                          </div>
                        </td>
                        <td className="py-4 pl-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEdit(entry)}
                              className="px-3 py-1.5 bg-white text-primary-950 text-xs rounded-lg hover:bg-primary-950/10 border border-primary-950/20 shadow-sm hover:shadow transition-all flex items-center gap-1"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(entry.id)}
                              className="px-3 py-1.5 bg-white text-red-600 text-xs rounded-lg hover:bg-red-50 border border-red-200 shadow-sm hover:shadow transition-all flex items-center gap-1"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {selectedBanner && (
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
              <h2 className="text-2xl font-bold text-gray-800">Category Details</h2>
              <div className="w-12 h-1 bg-accent-500 mt-2 rounded-full"></div>
            </div>

            {/* Category Info (Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-800 font-medium">{selectedBanner.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(selectedBanner.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <img 
                    src={`${import.meta.env.VITE_DOCS_URL}${selectedBanner.image_url}`} 
                    alt={selectedBanner.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onError = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Category Description */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Description</p>  
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedBanner.description) }}
                  className="border border-gray-200 p-4 rounded-md bg-gray-50 text-sm leading-relaxed text-gray-800"
                />
              </div>
          </div>
        </div>
      )}  
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => handlePrevPage(page)}
          disabled={page === 1}
          className="bg-white hover:bg-primary-950/10 text-primary-950 px-4 py-2 rounded-lg border border-primary-950/20 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:hover:bg-white"
        >
          Previous
        </button>
        <span className="text-primary-950 font-medium">Page {page} of {totalPages}</span>
        <button
          onClick={() => handleNextPage(page)}
          disabled={page === totalPages}
          className="bg-white hover:bg-primary-950/10 text-primary-950 px-4 py-2 rounded-lg border border-primary-950/20 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:hover:bg-white"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default BannerTable;