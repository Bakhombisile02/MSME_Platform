import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getReportedIncidentsList } from '../../api/incident-reported';


const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'  font-family='sans-serif' font-size='12px' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E";


const IncidentReported = () => {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalData,setTotalData]=useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  const handleRowClick = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };
  
  useEffect(() => {
    fetchIncidents();
  }, [page]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await getReportedIncidentsList(page, limit);
      // Handle the specific response structure
      if (response && response.values && response.values.rows) {
        setIncidents(response.values.rows || []);
        setTotalPages(response.total_pages || 1);
        setTotalData(response.total)
      } else {
        setIncidents([]);
        setTotalPages(1);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.error || error.message || 'Failed to fetch incident reports',
      });
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  // Utility to get first N words of a message
  const getFirstWords = (text, wordCount) => {
    const words = text.split(" ");
    return words.slice(0, wordCount).join(" ") + (words.length > wordCount ? "..." : "");
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Incident Reported</span>
      </div>
      
      <div className="flex items-center justify-between bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 text-white py-4 text-start mb-6 ">
        <h1 className="text-xl font-medium">Incident Reported</h1>
            <div className="text-sm ">
             <span> {totalData} Entries Found </span>
            </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <>                   
        <div className="bg-white shadow-lg text-primary-950 overflow-x-auto text-sm ">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-950/5 py-5">
              <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                  <th className="py-3 pl-3  text-left font-medium  tracking-wider">
                    Full Name
                  </th>
                  <th className="py-3 pl-3  text-center font-medium  tracking-wider">Image</th>
                  <th className="py-3 pl-3  text-left font-medium  tracking-wider">
                    Mobile Number
                  </th>
                  <th className="py-3 pl-3  text-left font-medium  tracking-wider">
                    Locations
                  </th>
                  <th className="py-3 pl-3  text-left font-medium  tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y  divide-gray-200">
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <tr key={incident.id}   onClick={() => handleRowClick(incident)}  className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4  ">
                        {incident.name}
                      </td>
                      <td className="py-3 px-4 text-center flex justify-center  font-medium">
                          <img 
                            src={`${import.meta.env.VITE_DOCS_URL}${incident.url}`} 
                            alt={incident.name} 
                            className=" w-14 h-14  rounded-lg  object-cover"
                            onError={(e) => {
                              e.target.onError = null;
                              e.target.src = placeholderImage;
                            }}
                          />
                      </td>
                      <td className="py-3 px-4  ">
                        {incident.mobile}
                      </td>
                      <td className="py-3 px-4  ">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 text-sm  max-w-md truncate">
                      {getFirstWords(incident.message, 5)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No incident reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {isModalOpen && selectedIncident && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
                {/* Close Button (Top-right) */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-red-500">🚨</span> Incident Details
                  </h2>
                  <div className="w-12 h-1 bg-accent-500 mt-2 rounded-full"></div>
                </div>

                {/* Content (Image + Details) */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image Section */}
                  <div className="flex justify-center md:justify-start">
                    <img
                      src={`${import.meta.env.VITE_DOCS_URL}${selectedIncident.url}`}
                      alt={selectedIncident.name || "Incident image"}
                      className="w-48 h-48 rounded-xl object-cover border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  </div>

                  {/* Details Section (Grid Layout) */}
                  <div className="grid grid-cols-1 gap-4 flex-1">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-gray-800 font-medium">{selectedIncident.name || "---"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Mobile No</p>
                      <p className="text-gray-800 font-medium">{selectedIncident.mobile || "---"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-800 font-medium">{selectedIncident.location || "---"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Message</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                        {selectedIncident.message || "---"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
       {incidents.length > 0 && (
        <div className="flex justify-between items-center mt-4">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
                >
                  Previous
                </button>
                <div className="hidden md:flex items-center px-4">
                  <p className="text-primary-950 font-medium">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
                >
                  Next
                </button>
              </div>
            </div>
          )}
    </div>
  );
};

export default IncidentReported; 