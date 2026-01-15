import React, { useEffect, useState } from 'react';
import {   getSubscriberList } from '../../api/user-lists';
import { exportSubscriberListToExcel } from '../../utils/exports/excel-subscriber-list-export';

const Subscribers = () => {
  const [subcriberList, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData,setTotalData]=useState(0);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchData = async (page, limit) => {
    try {
      const data = await getSubscriberList(page, limit);
      setData(data?.values?.rows || []);
      setTotalData(data?.total ?? 0);
      setTotalPages(data?.total_pages || 1);
      setError(null);
    } catch (err) {
      setError(err.message || String(err));
      setData([]);
    }
  };

  useEffect(() => {
    fetchData(page, limit);
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleExcelExport = async () => {
    const response = await getSubscriberList( 1, 200 );
    if ( response?.values?.rows ) {
      exportSubscriberListToExcel( response.values.rows || [] );
    }
  };
 

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Subscribers</span>
      </div>
      <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6   flex justify-between items-center">
        Subscribers
        <div className="flex items-center justify-center gap-4 text-sm">
            <span> {totalData} Entries Found </span>
            <div className="flex justify-end">
            <button
              onClick={ handleExcelExport }
              className="bg-white text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 transition-colors"
            >
              Export Excel
            </button>
          </div>
          </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      <div className="bg-white shadow-lg  text-primary-950 pb-5 overflow-x-auto text-sm ">
          <table className="min-w-full text-sm ">
            <thead className="bg-primary-950/5 py-5">
              <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">EMAIL ID</th>
              <th className="py-3 pl-3  text-left font-medium  tracking-wider">Created AT</th>
            </tr>
          </thead>
          <tbody className="divide-y text-primary-950  divide-gray-200">
            {subcriberList.length > 0 ? (
              subcriberList.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors" >
                  <td className="py-3 px-4  ">{entry.email}</td>
                  <td className="py-3 px-4">{new Date(entry.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center px-4 py-6 text-gray-500">
                  No Subscriber available.
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



    </div>
  );
};

export default Subscribers;
