"use client";
import { getSearchServiceCategory, getServiceProviderCategoryList } from '@/apis/service-provider-api';
import Partners from '@/components/Partners';
import Subscribe from '@/components/Subscribe';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

 const cleanAndTruncateDescription = (html) => {
    if (!html) return '';
    
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');
    
    // Truncate to 10 words
    const words = text.split(' ');
    if (words.length > 10) {
      return words.slice(0, 20).join(' ') + '...';
    }
    return text;
  };

const ProviderCard = ({ provider, index }) => (
    <div className="bg-white p-10 rounded-lg shadow-md relative flex flex-col h-full transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl">
      <div className="absolute top-8 right-8 px-2 text-black text-lg font-medium border-b border-l border-black/20 pl-1 rounded-bl-lg">
      {index < 9 ? `0${index + 1}` : index + 1}
      </div>
      <div className="flex justify-start mb-6">
        <div className="  w-16 h-16 flex items-center justify-center rounded-none">
          <img 
        src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${provider.icon_url}` }
        className='w-full h-full'/>
        </div>
      </div>
      <div className='h-48  '>
      <h3 className="text-xl font-bold mb-2">{provider.name}</h3>
      <p className="text-gray-600 mb-4  line-clamp-4">
          {cleanAndTruncateDescription(provider.description)}
      </p>
      </div>
      <div className="mt-auto pt-4 border-t">
        <Link href={`/service-providers/provider-details/${provider.id}`} className="text-gray-700 hover:text-secondary/80 font-medium flex items-center gap-2">
          View Details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
);

const Page = () => {

  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0
  });

  const fetchData = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await getServiceProviderCategoryList(page, limit);
      setProviders(response.values.rows);
      setPagination({
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        total: response.total
      });
    } catch (error) {
      console.error("Error fetching service providers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchData(newPage, pagination.limit);
    }
  };
  const searchData = async () => {
    try {
      setLoading(true);
      if (searchTerm.trim() === '') {
        // If empty, load normal data
        await fetchData();
      } else {
        const response = await getSearchServiceCategory(searchTerm, 1, 15);
        console.log(response)
        setProviders(response);
        setPagination({
          page: 1,
          limit: 15,
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


  return (
    <div className="">
      {/* Hero Section */ }
      <div className="relative h-[600px]">
        <Image
          src="/images/service_providers/group-of-business-people-1.jpg"
          alt="Service Providers Hero"
          fill
          className="object-cover"
        />
      </div>

      {/* Description Section */ }
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-opacity-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-md font-thin">Explore our Recommended Service Providers</p>
            <h1 className="text-3xl md:text-4xl font-bold my-4">Services for all  your needs</h1>
          </div>
        </div>
        <div className="text-sm leading-7">
          <p className="text-gray-600 mb-6">
          The following categories of recommended service providers for Micro, Small, and Medium Enterprises (MSMEs) have been carefully selected through a thorough evaluation process. Each category holds a list of firms shortlisted after an in-depth review based on their relevance, reliability and track record in supporting MSME growth in Eswatini. This process was guided by the intention to create a resource that business owners and entrepreneurs can trust when seeking expert support for different operational needs.          </p>
        </div>
      </div>
      {/* Search section with a search button */ }
      <div className="w-full md:max-w-7xl mx-auto px-4">
        <div className="flex justify-end">
          <div className="w-full md:w-[45%] bg-white shadow-md rounded-lg flex items-center px-4 py-2 border border-gray-200 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
            <svg
              className="w-5 h-5 text-gray-400 mr-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchData();
              }}
              placeholder="Search by category name..."
              className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />

            <button
              onClick={searchData}
              className="ml-3 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-1.5 rounded-lg transition duration-200"
            >
              Search
            </button>

          </div>
        </div>
      </div>
       
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">Loading service providers...</div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider, index) => (
              <ProviderCard key={provider.id} provider={provider} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">No service providers found.</div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 mb-16">
        <div className="flex gap-2 justify-between items-center">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 bg-white text-gray-500 border border-gray-300 rounded transition ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          >
            <span className="hidden md:block">← </span>Previous
          </button>

          {/* Page Numbers Centered */}
          <div className="space-x-2">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-4 py-2 ${pagination.page === pageNum ? 'bg-primary text-white border border-primary' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'} rounded`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
            className={`flex items-center gap-2 px-5 py-2 bg-white text-gray-500 border border-gray-300 rounded transition ${pagination.page === pagination.total_pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          >
            Next <span className="hidden md:block">→</span>
          </button>
        </div>
      </div>


      {/* Common Section */ }
      <div><Subscribe /></div>
      <div><Partners /></div>
    </div>
  );
};

export default Page