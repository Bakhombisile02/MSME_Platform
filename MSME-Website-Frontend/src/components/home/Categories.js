import Link from 'next/link';
import { IoIosSend } from "react-icons/io";
import { useEffect, useState } from 'react';
import { getBusinessCategoryList } from '@/apis/business-category-api';
import Image from 'next/image';

export default function Categories () {
  const [ categories, setCategories ] = useState( [] );
  const [ loading, setLoading ] = useState( true );
  const [ error, setError ] = useState( null );
  const [ keyword, setKeyword ] = useState( '' );
  const [ region, setRegion ] = useState( '' );
  const [ isKeywordError, setIsKeywordError ] = useState( false );

  useEffect( () => {
    const fetchCategories = async () => {
      try {
        setLoading( true );
        const response = await getBusinessCategoryList( 1, 23 );
        if ( response?.values?.rows ) {
          setCategories( response.values.rows );
        }
      } catch ( err ) {
        console.error( 'Error fetching categories:', err );
        setError( 'Failed to load categories' );
      } finally {
        setLoading( false );
      }
    };

    fetchCategories();
  }, [] );

  const handleSearch = () => {
    if (keyword && keyword.length < 2) {
      setIsKeywordError(true);
      return;
    }
    setIsKeywordError(false);
    
    if (!region && !keyword) {
      setIsKeywordError(true);
      return;
    }
    
    window.location.href = `/categories?region=${region}&keyword=${keyword}`;
  };

  return (
    <section className="pb-8 sm:pb-12 pt-[50px] sm:pt-[70px] bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex relative items-center mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row min-w-[100%] mx-auto max-w-md py-2 border border-gray-200 rounded-md">
            <div className="flex w-full border-b sm:border-b-0 sm:border-r border-gray-200">
              <input
                type='text'
                placeholder='Keywords'
                value={ keyword }
                onChange={ ( e ) => {
                  setKeyword( e.target.value );
                  setIsKeywordError( false );
                } }
                className={ `w-full px-3 sm:px-4 py-2 sm:py-3 focus:outline-none ${isKeywordError ? 'border-2 border-red-500' : ''}` }
              />
            </div>
            <div className="flex w-full">
              <select
                value={ region }
                onChange={ ( e ) => setRegion( e.target.value ) }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 focus:outline-none"
              >
                <option value="">Select Region</option>
                <option value="Hhohho">Hhohho</option>
                <option value="Lubombo">Lubombo</option>
                <option value="Manzini">Manzini</option>
                <option value="Shiselweni">Shiselweni</option>
              </select>
              <div
                className='text-xl text-gray-500 flex items-center md:justify-center justify-end px-3 sm:px-4'
                onClick={ handleSearch }
              >
                <IoIosSend className='cursor-pointer' />
              </div>
            </div>
            <button
              onClick={ handleSearch }
              className="rounded-sm cursor-pointer px-4 sm:px-5 py-2 mx-2 sm:mx-4 text-white text-base sm:text-lg font-semibold bg-gradient-to-r from-[#2E458D] via-[#2E458D] to-[#1c2dadd2]"
            >
              Search
            </button>
          </div>
          { isKeywordError && (
            <div className="absolute -bottom-10 text-red-500 text-sm text-center mb-4">
              Please enter at least 3 characters for keyword search
            </div>
          ) }
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg uppercase font-semibold text-gray-500">TOP CATEGORIES</h2>
          <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Top Business Categories</h3>

          { loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">{ error }</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              { categories.slice(0,11).map( ( category ) => (
                <Link
                  key={ category.id }
                  href={ `/categories?categoryId=${category.id}` }
                  className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-md hover:bg-primary hover:text-white transition text-center"
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
              <Link
                href="/all-categories"
                className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-primary text-white rounded-md hover:opacity-90 transition text-center"
              >
                <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-9 sm:h-9 md:w-10 md:h-10">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <h4 className="text-sm sm:text-base font-semibold">VIEW ALL</h4>
              </Link>
            </div>
          ) }
        </div>
      </div>
    </section>
  );
}