"use client";
import { getSearchServiceProvider, getServiceProviderbyID } from "@/apis/service-provider-api";
import Partners from "@/components/Partners";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { sanitizeHTML } from "@/utils/sanitize";

const Page = () => {
  const { slug } = useParams()
  console.log( "param", slug )
  const [ provider, setProvider ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [searchTerm, setSearchTerm] = useState('');


  const [ pagination, setPagination ] = useState( {
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0
  } );

  const fetchData = async ( slug, page, limit ) => {
    try {
      setLoading( true );
      const response = await getServiceProviderbyID( slug, page, limit );
      setProvider( response.values.rows );
      setPagination( {
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        total: response.total
      } );
    } catch ( error ) {
      console.error( "Error fetching service providers:", error );
    } finally {
      setLoading( false );
    }
  };


  const searchData = async () => {
      try {
        setLoading(true);
        if (searchTerm.trim() === '') {
          // If empty, load normal data
          await fetchData(slug,1,10);
          return
        } else {
          const response = await getSearchServiceProvider(searchTerm, 1, 15);
          console.log(response)
          setProvider(response);
          setPagination({
            page: 1,
            limit: 10,
            total_pages: 1,
            total:1
          });
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };
  

  const handlePageChange = ( newPage ) => {
    if ( newPage >= 1 && newPage <= pagination.total_pages ) {
      fetchData( slug, newPage, pagination.limit );
    }
  };

  useEffect( () => {

    if ( slug ) {
      fetchData( slug );
    }
  }, [ slug ] );

  return (
    <div className="min-h-screen">
      <div className="relative h-[600px]">
        <Image src="/images/service_providers/service-provider-details-banner.jpg" alt="Provider Details" fill className="object-cover object-center" />
      </div>
      <div className="bg-[#f5f7f8]">
        {/* section 1 */ }
        <div className="flex flex-col items-center justify-center text-center py-16 mx-4 md:mx-0">
          <span className="text-gray-400 text-sm font tracking-widest mb-2">SERVICE PROVIDERS</span>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900/80">Our Full Range of Service Providers</h1>
          <p className="text-[15px] text-gray-500 max-w-[45rem] mb-8">
            Explore our comprehensive range of gardening and landscaping services designed to enhance the beauty and functionality of your outdoor spaces.
          </p>
          <div  className="w-full max-w-5xl  flex items-center mt-2 shadow-sm shadow-primary/20">
             <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchData(); // Pressing Enter triggers search
              }}
              placeholder="Search by services provider name..."
              className="w-full mx-5 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />

            <button type="submit" onClick={searchData} className="bg-primary shadow-md shadow-primary/50 hover:bg-gray-500 text-white px-4 py-[11.5px] rounded-r-md flex items-center justify-center transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
              </svg>
            </button>
          </div>
        </div>
        {/* section 2 */ }
        <div className="flex flex-col gap-10 items-center">
          { loading ? (
            <div className="text-center py-12">Loading service providers...</div>
          ) : provider.length > 0 ? (
            provider?.map( ( entry, index ) => (
              <div key={ index } className="bg-white rounded-xl shadow-md flex flex-col md:flex-row w-full max-w-6xl p-5 gap-6 md:gap-8 items-stretch">
                <div className="md:w-[25%] w-full flex-shrink-0 flex items-center justify-center">
                  <Image src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${entry.url}` } alt="Service Provider 1" width={ 340 } height={ 180 } className="rounded-lg object-cover w-full h-48 md:h-56" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 font-semibold">
                    <div className="flex w-full md:w-1/2 flex-col gap-3 md:gap-4">
                      <div className="flex items-center gap-2 text-black text-[15px]"><FaUser className="text-3xl border-2 rounded-full px-2 text-primary" size={30} /> { entry.name }</div>
                      <div className="flex items-center gap-2 text-black text-[15px]"><FaPhone className="text-3xl border-2 rounded-full px-2 text-primary" size={30} />{ entry.mobile }</div>
                    </div>
                    <div className="flex w-full md:w-1/2 flex-col gap-2 md:gap-4">
                      <div className="flex items-center gap-2 text-black text-[15px]"><FaEnvelope className="text-3xl border-2 rounded-full px-2 text-primary" size={30} />{ entry.email }</div>
                      <div className="flex items-center gap-2 text-black text-[15px]"><FaMapMarkerAlt className="text-3xl border-2 rounded-full px-2 text-primary" size={30} />{ entry.address }</div>
                    </div>
                  </div>
                  <hr className="my-2 border-gray-200" />
                  <div>
                    <h2 className="text-primary text-xl font-semibold mb-2">{ entry.business_name }</h2>
                    <p className="text-gray-500 min-h-20 text-sm" dangerouslySetInnerHTML={ { __html: sanitizeHTML(entry.business_description) } }/>
                  </div>
                </div>
              </div>
            ) ) ) : (
            <div className="text-center py-12">No service providers found.</div>
          ) }
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pb-12">
          <div className="flex gap-2 justify-between items-center">
            {/* Previous Button */ }
            <button
              onClick={ () => handlePageChange( pagination.page - 1 ) }
              disabled={ pagination.page === 1 }
              className={ `flex items-center gap-2 px-3 md:px-5 py-2 bg-white text-gray-500 border border-gray-300 rounded transition ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}` }
            >
              <span className="hidden md:block">← </span>Previous
            </button>

            {/* Page Numbers Centered */ }
            <div className="space-x-2">
              { Array.from( { length: pagination.total_pages }, ( _, i ) => i + 1 ).map( pageNum => (
                <button
                  key={ pageNum }
                  onClick={ () => handlePageChange( pageNum ) }
                  className={ `px-4 py-2 ${pagination.page === pageNum ? 'bg-primary text-white border border-primary' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'} rounded` }
                >
                  { pageNum }
                </button>
              ) ) }
            </div>

            {/* Next Button */ }
            <button
              onClick={ () => handlePageChange( pagination.page + 1 ) }
              disabled={ pagination.page === pagination.total_pages }
              className={ `flex items-center gap-2 px-5 py-2 bg-white text-gray-500 border border-gray-300 rounded transition ${pagination.page === pagination.total_pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}` }
            >
              Next <span className="hidden md:block">→</span>
            </button>
          </div>
        </div>
      </div>



      {/* Partners Section */ }
      <div><Partners /></div>
    </div>
  );
};
export default Page