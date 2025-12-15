import React from 'react';
import { useNavigate } from 'react-router-dom';

const placeholderImage = "/assets/logo_msme.png";

const MsmeBusinessTable = ( { data, page, totalPages, handleNextPage, handlePrevPage, loading, showActionButtons } ) => {
  const navigate = useNavigate();


  const getVerificationStatus = ( isVerified ) => {
    return (
      <span className={ `px-2 py-1 rounded-full text-xs font-medium ${isVerified === "2" ? 'bg-green-100 text-green-800' :
          isVerified === "3" ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'}` }>
        { isVerified === "2" ? 'Approved' :
          isVerified === "3" ? 'Rejected' :
            'Pending' }
      </span>
    );
  };

  return (
    <>
      <div className="bg-[#e6e9ee] shadow-xl overflow-hidden border border-primary-950/20">
        { loading ? (
          <div className="flex items-center justify-center p-12 bg-white/50">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#e6e9ee] border-t-accent-500 rounded-full animate-spin mb-4"></div>
              <p className="text-primary-950 font-medium">Loading data...</p>
            </div>
          </div>
        ) : (
          <>
            { data.length === 0 ? (
              <div className="text-center py-16 bg-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-primary-950/50 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-primary-950 text-lg font-medium mb-1">No MSME Businesses found</h3>
                <p className="text-primary-950/70 mb-6">Add a new MSME business to get started</p>

              </div>
            ) : (
              <div className="overflow-x-auto bg-white shadow-sm rounded-b-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary-950/5 py-5">
                    <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                      <th className="py-4 pl-6 text-left font-medium tracking-wider">S. No</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Image</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Business Name</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Category</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Sub-Category</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Type</th>
                      <th className="py-4 pl-3 text-left font-medium tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-primary-950/10">
                    { data.map( ( business, index ) => (
                      <tr key={ business.id } onClick={ () => navigate( `/msme-detail?id=${business.id}&actionButtons=${showActionButtons}` ) } className="hover:bg-primary-950/5 transition-colors">
                        <td className="py-4 pl-6 font-medium text-primary-950">
                          { index + 1 + ( page - 1 ) * 10 }
                        </td>
                        <td className="py-4 pl-3">
                          <div
                            className="w-14 h-14 rounded-lg overflow-hidden bg-[#e6e9ee] border border-primary-950/20 flex-shrink-0 shadow-sm cursor-pointer"
                          >
                            <img
                              src={ `${import.meta.env.VITE_DOCS_URL}${business.business_image_url}` || placeholderImage }
                              alt={ business.name_of_organization }
                              className="w-full h-full object-cover"
                              onError={ ( e ) => {
                                e.target.onError = null;
                                e.target.src = placeholderImage;
                              } }
                            />
                          </div>
                        </td>
                        <td
                          className="py-4 pl-3 font-medium text-primary-950 cursor-pointer"
                        >
                          <div className="w-56 truncate" title={ business.name_of_organization }>
                            { business.name_of_organization }
                          </div>
                          <div className="text-xs text-primary-950/70 mt-1">
                            { business.town }, { business.region }
                          </div>
                        </td>
                        <td className="py-4 pl-3">
                          { business.business_category_name }
                        </td>
                        <td className="py-4 pl-3">
                          { business.business_sub_category_name }
                        </td>
                        <td className="py-4 pl-3">
                          { business.business_type }
                        </td>
                        <td className="py-4 pl-3">
                          { getVerificationStatus( business.is_verified ) }
                        </td>
                      </tr>
                    ) ) }
                  </tbody>
                </table>
              </div>
            ) }
          </>
        ) }
      </div>

      {/* Pagination Controls */ }
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={ () => handlePrevPage( page ) }
          disabled={ page === 1 }
          className="bg-white hover:bg-primary-950/10 text-primary-950 px-4 py-2 rounded-lg border border-primary-950/20 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:hover:bg-white"
        >
          Previous
        </button>
        <span className="text-primary-950 font-medium">Page { page } of { totalPages }</span>
        <button
          onClick={ () => handleNextPage( page ) }
          disabled={ page === totalPages }
          className="bg-white hover:bg-primary-950/10 text-primary-950 px-4 py-2 rounded-lg border border-primary-950/20 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:hover:bg-white"
        >
          Next
        </button>
      </div>

    </>
  );
};

export default MsmeBusinessTable;