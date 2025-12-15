"use client";
import { getBusinessCategoryList, getSearchCategory } from "@/apis/business-category-api";
import Partners from "@/components/Partners";
import Subscribe from "@/components/Subscribe";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const Page = () => {
  const [ categories, setCategories ] = useState( [] );
  const [ loading, setLoading ] = useState( true );
  const [ error, setError ] = useState( null );
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_pages: 1,
    total: 0
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchCategories(newPage, pagination.limit);
    }
  };
  const searchData = async () => {
    try {
      setLoading(true);
      if (searchTerm.trim() === '') {
      
        await fetchCategories();
      } else {
        const response = await getSearchCategory(searchTerm, 1, 15);
        console.log(response)
        setCategories(response);
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
  const fetchCategories = async (page = 1, limit = 10) => {
    try {
      setLoading( true );
      const response = await getBusinessCategoryList(page, limit);
      console.log(response)
      if ( response?.values?.rows ) {
        setCategories( response.values.rows );
        setPagination({
          page: response.page,
          limit: response.limit,
          total_pages: response.total_pages,
          total: response.total
        });
      }
    } catch ( err ) {
      console.error( 'Error fetching categories:', err );
      setError( 'Failed to load categories' );
    } finally {
      setLoading( false );
    }
  };
  useEffect( () => {

    fetchCategories();
  }, [] );

  return (
    <div>
      <div className="about_bg h-[95vh] w-full relative">
          <svg
            className="absolute -bottom-0.5 left-0 w-full rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <path
              className="fill-white"
              d="M0,50
              C125,100 375,0 500,50
              C625,100 875,0 1000,50
              L1000,0
              L0,0
              Z"
            />
          </svg>
        </div>
      <div className="text-center py-16">

        <h2 className="text-base sm:text-lg uppercase font-semibold text-gray-500">ALL CATEGORIES</h2>
        <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-2">All Business Categories</h3>
        <div className="px-8 py-8">
          <div className="w-full max-w-[82.5rem] mx-auto pl-4 bg-white shadow-md rounded-lg flex items-center border border-gray-200 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
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
                if (e.key === 'Enter') searchData(); // Pressing Enter triggers search
              }}
              placeholder="Search for Categories..."
              className="w-full py-3 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            />

            <button
              onClick={searchData}
              className="ml-3 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-3 rounded-r-lg border border-primary transition duration-200"
            >
              Search
            </button>

          </div>
        </div>
        { loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{ error }</div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            { categories.map( ( category ) => (
              <Link
                key={ category.id }
                href={ `/categories?categoryId=${category.id}` }
                className="flex flex-col w-[250px] items-center justify-center p-8 bg-gray-100 rounded-md hover:bg-primary hover:text-white transition text-center"
              >
                <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <Image
                    src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${category.icon_url}` }
                    alt={ category.name }
                    width={ 50 }
                    height={ 50 }
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                </div>
                <h4 className="text-sm sm:text-base font-semibold">{ category.name }</h4>
              </Link>
            ) ) }
          </div>
        ) }

        <div className="max-w-7xl mx-auto px-4 mt-16 mb-8">
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

      </div>

      <div>
        <Subscribe />
        <Partners />
      </div>
    </div>
  )
};
export default Page