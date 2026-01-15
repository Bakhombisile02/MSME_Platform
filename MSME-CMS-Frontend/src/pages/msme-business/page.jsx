import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getMsmeBusinessData } from '../../api/msme-business';
import MsmeBusinessTable from '../../components/msme-business/msme-business-table';
import { exportMSMEBusinessReportExcel } from '../../utils/exports/export-msme-business';
import { useParams, useNavigate } from 'react-router-dom';

const MsmeBusiness = () => {
  const [bannerData, setArticleData] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(0);

  const { filter } = useParams();
  const navigate = useNavigate();

  const handlePrevPage = (currentPage) => {
    if (currentPage > 1) {
      setPage((prev) => prev - 1);
    }
  };
  
  const handleNextPage = (currentPage) => {
    if (currentPage < totalPages) {
      setPage((prev) => prev + 1);
    }
  };
  
  const fetchData = async (status, currentPage) => {
    try {
      setLoading(true);
      const filterStatus = status !== undefined && status !== null ? status : statusFilter;
      const data = await getMsmeBusinessData(filterStatus, currentPage || page, limit);
      setArticleData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data?.total);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch MSME business.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  }; 

  const handleExport = async () => {
    try {
      const exportStatus = statusFilter !== undefined && statusFilter !== null ? statusFilter : 0;
      const response = await getMsmeBusinessData(exportStatus, 1, 500);
      exportMSMEBusinessReportExcel(response.values.rows);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Error!',
        text: 'Failed to export MSME business data.',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
    navigate(`/msme-business/${status}`);
  };

  // Single useEffect to handle all data fetching
  useEffect(() => {
    // Determine the current filter to use
    const currentFilter = filter !== undefined ? parseInt(filter) : statusFilter;
    
    // Only fetch data if we have a valid filter value
    if (currentFilter !== undefined && currentFilter !== null) {
      fetchData(currentFilter, page);
    }
  }, [filter, page]); // Only depend on filter and page changes

  // Separate useEffect to sync statusFilter with URL parameter (without triggering API calls)
  useEffect(() => {
    if (filter !== undefined) {
      const filterValue = parseInt(filter);
      setStatusFilter(filterValue);
      setPage(1);
    }
  }, [filter]);

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">MSME Business</span>
      </div>

      <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white flex justify-between items-center mb-6">
        <span>MSME Business</span>
        <div className='gap-5 flex flex-row'>
        <div className="flex items-center gap-5">
          <span className="text-sm text-white/80">{totalData} Entries Found</span>
        </div>
          <button
            onClick={() => handleStatusFilter(0)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 ${
              statusFilter === 0 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800'
            }`}
          >
            ALL 
          </button>
          <button
            onClick={() => handleStatusFilter(1)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 ${
              statusFilter === 1 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800'
            }`}
          >
            Pending 
          </button>
          <button
            onClick={() => handleStatusFilter(2)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 ${
              statusFilter === 2 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800'
            }`}
          >
            Approved 
          </button>
          <button
            onClick={() => handleStatusFilter(3)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 ${
              statusFilter === 3 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800'
            }`}
          >
            Rejected 
          </button>
          <button
            onClick={handleExport}
            className="bg-white text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50"
          >
            Export 
          </button>
        </div>
      </div>

      <MsmeBusinessTable
        data={bannerData}
        totalData={totalData}
        page={page}
        totalPages={totalPages}
        handleNextPage={handleNextPage}
        handlePrevPage={handlePrevPage}
        loading={loading}
        showActionButtons = {true}
      />
    </div>
  );
};

export default MsmeBusiness;