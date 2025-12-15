import React, { useEffect, useState } from 'react';
import { getServiceProviderListByCategory, getServiceProviderListByCategoryId } from '../../api/user-lists';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ServiceProviderTable from '../../components/service-provider/service-provider-table';

const exportServiceProviderByCategoryExcel = ( data ) => {
  if ( !Array.isArray( data ) ) {
    console.error( 'Invalid or missing data structure' );
    return;
  }
  const rows = data.map( ( item, index ) => ( {
    'S.No': index + 1,
    'Category ID': item.categorie_id || '',
    'Category Name': item.categorie_name || '',
    'Total Providers': item.total_providers || 0,
  } ) );
  const worksheet = XLSX.utils.json_to_sheet( rows );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet( workbook, worksheet, 'Service Providers By Category' );
  const excelBuffer = XLSX.write( workbook, { bookType: 'xlsx', type: 'array' } );
  const blob = new Blob( [ excelBuffer ], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } );
  saveAs( blob, 'Service_Provider_By_Category.xlsx' );
};

const ServiceProviderListByCategory = () => {
  const [ categoryList, setCategoryList ] = useState( [] );
  const [ totalData, setTotalData ] = useState( 0 );
  const [ selectedCategory, setSelectedCategory ] = useState( null );
  const [ providerList, setProviderList ] = useState( [] );
  const [ providerLoading, setProviderLoading ] = useState( false );
  const [ providerModalOpen, setProviderModalOpen ] = useState( false );
  // Pagination state for providers (optional, if API supports it)
  const [ providerPage ] = useState( 1 );
  const [ providerTotalPages ] = useState( 1 );

  useEffect( () => {
    const fetchData = async () => {
      try {
        const res = await getServiceProviderListByCategory();
        setCategoryList( res.data || [] );
        setTotalData( ( res.data && res.data.length ) || 0 );
      } catch ( err ) {
        setCategoryList( [] );
        setTotalData( 0 );
        console.error( 'Error fetching service provider by category', err );
      }
    };
    fetchData();
  }, [] );

  const handleExcelExport = () => {
    exportServiceProviderByCategoryExcel( categoryList );
  };

  const handleRowClick = async ( entry ) => {
    setSelectedCategory( entry );
    setProviderLoading( true );
    setProviderModalOpen( true );
    try {
      const res = await getServiceProviderListByCategoryId( { id: entry.categorie_id } );
      setProviderList( res.values.rows || [] );
    } catch ( err ) {
      setProviderList( [] );
      console.error( 'Error fetching providers for category', err );
    } finally {
      setProviderLoading( false );
    }
  };

  const closeProviderModal = () => {
    setProviderModalOpen( false );
    setProviderList( [] );
    setSelectedCategory( null );
  };


  {/* Modal for Service Providers List */ }
  if ( providerModalOpen ) {
    return (
      <div className='p-6 px-10 min-h-screen'>
        <div className="text-sm text-gray-500 pb-5">
          Pages / <span className="text-gray-800">Service Provider By Category</span>
        </div>
        <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6 flex justify-between items-center">
          Service Providers in Category: { selectedCategory?.categorie_name }
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className='border py-1 px-2 rounded-md hover:bg-transparent/20 cursor-pointer' onClick={ closeProviderModal }>Close</div>
          </div>
        </div>
        <ServiceProviderTable
          data={ providerList }
          onEdit={ () => { } }
          onDelete={ () => { } }
          page={ providerPage }
          totalPages={ providerTotalPages }
          handleNextPage={ () => { } }
          handlePrevPage={ () => { } }
          loading={ providerLoading }
          showActions = {false}
        />
      </div>
    )
  } else {
    return (
      <div className="p-6 px-10 min-h-screen">
        <div className="text-sm text-gray-500 pb-5">
          Pages / <span className="text-gray-800">Service Provider By Category</span>
        </div>
        <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6 flex justify-between items-center">
          Service Provider By Categories
          <div className="flex items-center justify-center gap-4 text-sm">
            <span>{ totalData } Entries Found</span>
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
        <div className="bg-white shadow-lg text-primary-950 pb-5 overflow-x-auto text-sm">
          <table className="min-w-full text-sm ">
            <thead className="bg-primary-950/5 py-5">
              <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                <th className="py-3 pl-3 text-left font-medium tracking-wider">S No</th>
                <th className="py-3 pl-3 text-left font-medium tracking-wider">Category Name</th>
                <th className="py-3 pl-3 text-left font-medium tracking-wider">Total Providers</th>
              </tr>
            </thead>
            <tbody className="divide-y text-primary-950 divide-gray-200">
              { categoryList.length > 0 ? (
                categoryList.map( ( entry, index ) => (
                  <tr key={ index } className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={ () => handleRowClick( entry ) }>
                    <td className="py-3 px-4">{ index + 1 }</td>
                    {/* <td className="py-3 px-4">{entry.categorie_id}</td> */ }
                    <td className="py-3 px-4">{ entry.categorie_name }</td>
                    <td className="py-3 px-4">{ entry.total_providers }</td>
                  </tr>
                ) )
              ) : (
                <tr>
                  <td colSpan="4" className="text-center px-4 py-6 text-gray-500">
                    No Service Provider Category available.
                  </td>
                </tr>
              ) }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};

export default ServiceProviderListByCategory;