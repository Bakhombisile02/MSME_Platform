'use client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { getDownloadList } from '@/apis/lists-api';
import { sanitizeHTML } from '@/utils/sanitize';

export default function DownloadDocsPage () {
  const [ downloads, setDownloads ] = useState( [] );
  const [ loading, setLoading ] = useState( true );
  const [ pagination, setPagination ] = useState( {
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });

  const fetchDownloads = async () => {
    try {
      setLoading( true );
      const response = await getDownloadList( pagination.page, pagination.limit );
      setDownloads( response.values.rows );
      setPagination( {
        page: response.page,
        limit: response.limit,
        total: response.total,
        total_pages: response.total_pages
      } );
    } catch ( error ) {
      console.error( 'Error fetching downloads:', error );
    } finally {
      setLoading( false );
    }
  };
  console.log( "downloads:", downloads )
  useEffect( () => {
    fetchDownloads();
  }, [ pagination.page ] );

  const handlePageChange = ( newPage ) => {
    if ( newPage >= 1 && newPage <= pagination.total_pages ) {
      setPagination( prev => ( { ...prev, page: newPage } ) );
    }
  };

  return (
    <div className='bg-white'>
      {/* Banner section */ }
      <div className="relative h-[600px]">
        <Image
          src="/images/feedback/front.jpg"
          alt="Contact Hero"
          fill
          className="object-cover"
        />
        <svg
          className="absolute -bottom-0.5 left-0 w-full rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            className="fill-white"
            d="M0,30 
              C100,60 200,0 333,30 
              C433,60 533,0 666,30 
              C766,60 866,0 1000,30 
              L1000,0 
              L0,0 
              Z"
          />
        </svg>
      </div>
      {/* Latest News section */ }
      <div className="flex flex-col items-center justify-center pb-16 pt-12">
        <div className="text-center mb-8" >
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat text-primary mb-4">
            Latest News and Documents
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">          
          Stay informed with the latest updates, announcements, and downloadable resources. This page offers up to date content related to the MSME sector of Eswatini — all in one place.
          </p>
        </div>
        <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-4">
          { loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>

              <table className="block md:w-full min-w-48 overflow-x-auto text-left border-spacing-0">
                  <thead>
                  <tr>
                    <th className="bg-primary text-white font-semibold text-lg py-4 px-6 rounded-tl-xl whitespace-nowrap w-[80px]">S. No.</th>
                    <th className="bg-primary text-white font-semibold text-lg py-4 px-6 whitespace-nowrap w-[25%]">Title</th>
                    <th className="bg-primary text-white font-semibold text-lg py-4 px-6 whitespace-nowrap w-[40%]">Description</th>
                    <th className="bg-primary text-white font-semibold text-lg py-4 px-6 whitespace-nowrap w-[15%]">Upload Date</th>
                    <th className="bg-primary text-white font-semibold text-lg py-4 px-6 rounded-tr-xl whitespace-nowrap w-[120px]">Download</th>
                  </tr>
                </thead>
                <tbody>
                  { downloads.map( ( row, idx ) => (
                    <tr key={ row.id } className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="py-4 px-6 align-middle text-base font-medium text-gray-800">
                        { ( pagination.page - 1 ) * pagination.limit + idx + 1 }
                      </td>
                      <td className="py-4 px-6 align-middle text-base font-medium text-gray-800">
                        <div className="">{ row.name }</div>
                      </td>
                      <td className="py-4 px-6  align-middle text-base text-gray-700">
                        <div
                          className=" "
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(row.description) }}
                        />
                      </td>
                      <td className="py-4 px-6 align-middle text-base text-gray-700 whitespace-nowrap">
                        { new Date( row.createdAt ).toLocaleDateString() }
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <a
                          href={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${row.url}` }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary text-white font-semibold px-4 py-2 rounded shadow-md hover:bg-primary/90 hover:text-white/90 transition-all inline-block text-sm"
                        >
                          DOWNLOAD
                        </a>
                      </td>
                    </tr>
                  ) ) }
                </tbody>
              </table>
              {/* Footer */ }
              <div className="flex items-center justify-between px-4 py-4 bg-white rounded-b-xl border-t border-gray-100 mt-2">
                <div className="text-gray-700 text-sm">
                  Rows Per Page <span className="inline-block ml-2 border border-gray-300 rounded px-2 py-1">{ pagination.limit }</span>
                </div>
                <div className="text-gray-700 text-sm">
                  { ( ( pagination.page - 1 ) * pagination.limit ) + 1 }–{ Math.min( pagination.page * pagination.limit, pagination.total ) } of { pagination.total }
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={ `w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${pagination.page === 1 ? 'text-gray-400' : 'text-primary'}` }
                    onClick={ () => handlePageChange( pagination.page - 1 ) }
                    disabled={ pagination.page === 1 }
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button
                    className={ `w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${pagination.page === pagination.total_pages ? 'text-gray-400' : 'text-primary'}` }
                    onClick={ () => handlePageChange( pagination.page + 1 ) }
                    disabled={ pagination.page === pagination.total_pages }
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) }
        </div>
      </div>
    </div>
  );
}