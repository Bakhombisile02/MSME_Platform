import React, { useEffect, useState } from 'react';
import { getMsmeListByCategory, getMsmeListByCategoryId } from '../../api/user-lists';
import MsmeBusinessTable from '../../components/msme-business/msme-business-table';

const MsmeByCategory = () => {
  const [ msmeData, setMsmeData ] = useState( [] );
  const [ msmeDataByCategoryId, setMsmeDataByCategoryId ] = useState( [] );
  const [ page, setPage ] = useState( 1 );
  const [ totalPages, setTotalPages ] = useState( 1 );
  const [ selectedCategory, setSelectedCategory ] = useState( null );
  const [ totalData, setTotalData ] = useState( 0 );
  const [ selectedStatus, setSelectedStatus ] = useState( null );
  const [ loading, setLoading ] = useState(false);

  const fetchMsmeData = async () => {
    try {
      const data = await getMsmeListByCategory();
      console.log( "MSME Data By Category", data.data );
      setMsmeData( data.data || [] );
      setTotalData( data.data.length );
      setTotalPages( data?.total_pages || 1 );
    } catch ( err ) {
      console.error( "Error fetching MSME Data By Category", err );
    }
  };

  const fetchMsmeByCategoryId = async ( msme_category_id ) => {
    try {
      setLoading(true);
      const data = await getMsmeListByCategoryId( { msme_category_id } );
      console.log( "MSMEs List By Category ID", data.values?.rows );
      setMsmeDataByCategoryId( data.values?.rows || [] );
    } catch ( err ) {
      console.error( "Error fetching MSME Data By Category ID", err );
    } finally {
      setLoading(false);
    }
  };

  useEffect( () => {
    fetchMsmeData();
  }, [ page ] );

  useEffect( () => {
    if ( selectedCategory ) {
      fetchMsmeByCategoryId( selectedCategory );
    }
  }, [ selectedCategory ] );

  const handleNextPage = () => {
    if ( page < totalPages ) setPage( ( prev ) => prev + 1 );
  };

  const handlePrevPage = () => {
    if ( page > 1 ) setPage( ( prev ) => prev - 1 );
  };

  const openModal = ( business_category_id, status ) => {
    setSelectedCategory( business_category_id );
    setSelectedStatus( status || null );
    // console.log( "selected Status:", status )
  };

  const closeModal = () => {
    setSelectedCategory( null );
    setSelectedStatus( null );
  };

  const filteredMsmes = selectedStatus
    ? msmeDataByCategoryId.filter( ( msme ) => msme.is_verified == selectedStatus )
    : msmeDataByCategoryId;

  if ( selectedCategory ) {
    return (
      <div className="p-6 px-10 min-h-screen">
        <div className="text-sm text-gray-500 pb-5">
          Pages / <span className="text-gray-800">MSME By Category</span>
        </div>
        <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6   flex justify-between items-center">
          Total {selectedStatus == 1 ? "Pending" : selectedStatus == 2 ? "Approved" : selectedStatus == 3 ? "Rejected" : "" } MSMEs Of The Selected Category
          <div className="text-sm flex justify-between items-center gap-4">
            <div className="flex justify-between items-center">
              <button
                className="text-gray-50 hover:text-gray-100 transition-colors border border-gray-50 rounded px-3 py-1"
                onClick={ closeModal }
              >
                Close
              </button>
            </div>
          </div>
        </div>
        {/* MSME List By Category ID Table */ }
        { selectedCategory && (
          <div className="mt-10">
            
            <MsmeBusinessTable
              data={ filteredMsmes }
              page={ 1 }
              totalPages={ 1 }
              handleNextPage={ () => { } }
              handlePrevPage={ () => { } }
              loading={ loading }
              showActionButtons = {false}
            />
          </div>
        ) }
      </div>
    )
  } else {
    return (
      <div className="p-6 px-10 min-h-screen">
        <div className="text-sm text-gray-500 pb-5">
          Pages / <span className="text-gray-800">MSME By Categories</span>
        </div>
        <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6   flex justify-between items-center">
          MSME By Categories
          <div className="text-sm flex justify-between items-center gap-4">
            <span> { totalData } Entries Found </span>
          </div>
        </div>
        <div className="bg-white shadow-lg  text-primary-950 pb-5 overflow-x-auto text-sm ">
          <table className="min-w-full text-sm ">
            <thead className="bg-primary-950/5 py-5">
              <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">S. No</th>
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">Business Categories</th>
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">Total Requests</th>
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">Pending </th>
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">Approved </th>
                <th className="py-3 pl-3  text-left font-medium  tracking-wider">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y text-primary-950  divide-gray-200">
              { msmeData.length > 0 ? (
                msmeData.map( ( msme, index ) => (
                  <tr key={ index } className=" transition-colors">
                    <td className="py-3 px-4 ">{ ( page - 1 ) * 10 + index + 1 }</td>
                    <td className="py-3 px-4 ">{ msme.name }</td>
                    <td className="py-3 px-4 hover:bg-gray-50 cursor-pointer" onClick={ () => openModal( msme.id ) }>{ msme.total_msmes }</td>
                    <td className="py-3 px-4 hover:bg-gray-50 cursor-pointer" onClick={ () => openModal( msme.id, 1 ) }>{ msme.pending_count }</td>
                    <td className="py-3 px-4 hover:bg-gray-50 cursor-pointer" onClick={ () => openModal( msme.id, 2 ) }>{ msme.verified_count }</td>
                    <td className="py-3 px-4 hover:bg-gray-50 cursor-pointer" onClick={ () => openModal( msme.id, 3 ) }>{ msme.rejected_count }</td>
                  </tr>
                ) )
              ) : (
                <tr>
                  <td colSpan="5" className="text-center px-4 py-6 text-gray-500">
                    No MSME data available.
                  </td>
                </tr>
              ) }
            </tbody>
          </table>
        </div>
        {/* Pagination */ }
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={ handlePrevPage }
            disabled={ page === 1 }
            className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
          >
            Previous
          </button>
          <span className="text-primary-950 font-medium">Page { page } of { totalPages }</span>
          <button
            onClick={ handleNextPage }
            disabled={ page === totalPages }
            className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
          >
            Next
          </button>
        </div>


      </div>
    );
  }
};

export default MsmeByCategory;
