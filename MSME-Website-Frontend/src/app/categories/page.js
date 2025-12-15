"use client";
import React, { useState, useEffect } from "react";
import { IoLocationSharp, IoShareSocialSharp } from "react-icons/io5";
import { SlCallOut } from "react-icons/sl";
import { LuBuilding2 } from "react-icons/lu";
import { TbCategoryPlus } from "react-icons/tb";
import Partners from "@/components/Partners";
import Link from "next/link";
import { getBusinessCategoryList, getBusinessListByCategoryId, getBusinessListByKeyword, getBusinessListByregion, getBusinessListfilter, getBusinessSubCategoryList } from "@/apis/business-category-api";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';

const REGIONS = ["Hhohho", "Manzini", "Shiselweni", "Lubombo"];

const TINKHUNDLA = {
  "Hhohho": [
    "Hhukwini", "Lobamba", "Madlangempisi", "Maphalaleni", "Mayiwane",
    "Mbabane East", "Mbabane West", "Mhlangatane", "Motshane", "Ndzingeni",
    "Nkhaba", "Ntfonjeni", "Pigg's Peak", "Siphocosini", "Timphisini"
  ],
  "Manzini": [
    "Kukhanyeni", "Kwaluseni", "Lamgabhi", "Lobamba Lomdzala", "Ludzeludze",
    "Mafutseni", "Mahlangatsha", "Mangcongco", "Manzini North", "Manzini South",
    "Mhlambanyatsi", "Mkhiweni", "Mtfongwaneni", "Ngwempisi", "Nhlambeni",
    "Nkomiyahlaba", "Ntontozi", "Phondo"
  ],
  "Shiselweni": [
    "Gege", "Hosea", "Kubuta", "KuMethula", "Maseyisini",
    "Matsanjeni South", "Mtsambama", "Ngudzeni", "Nkwene", "Sandleni",
    "Shiselweni I", "Shiselweni II", "Sigwe", "Somntongo", "Zombodze"
  ],
  "Lubombo": [
    "Dvokodvweni", "Gilgal", "Lomahasha", "Lubuli", "Lugongolweni",
    "Matsanjeni North", "Mhlume", "Mpolonjeni", "Nkilongo", "Siphofaneni",
    "Sithobelweni"
  ]
};

const TURNOVER_RANGES = [
  { value: "0-50000", label: "E0 - E50,000" },
  { value: "50001-100000", label: "E50,001 - E100,000" },
  { value: "100001-250000", label: "E100,001 - E250,000" },
  { value: "250001-500000", label: "E250,001 - E500,000" },
  { value: "500001-1000000", label: "E500,001 - E1,000,000" },
  { value: "1000001+", label: "Above E1,000,000" }
];

const EMPLOYEE_RANGES = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-10", label: "6-10 employees" },
  { value: "11-20", label: "11-20 employees" },
  { value: "21-50", label: "21-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "100+", label: "100+ employees" }
];

const OWNERSHIP_TYPES = [
  "Sole Proprietorship",
  "Partnership", 
  "Private Limited Company",
  "Public Limited Company",
  "Cooperative",
  "Non-Profit Organization"
];

const RURAL_URBAN = [
  "Rural",
  "Urban",
  "Semi Urban"
];

const OWNER_GENDERS = [
  "Male",
  "Female",
  "Both"
];


const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get( 'categoryId' );
  const region = searchParams.get( 'region' );
  const keyword = searchParams.get( 'keyword' );
  const [ categories, setCategories ] = useState( [] );
  const [ subCategories, setSubCategories ] = useState( [] );
  const [ businesses, setBusinesses ] = useState( [] );
  const [ loading, setLoading ] = useState( true );
  const [ total, setTotal ] = useState( "" )
  const [ error, setError ] = useState( null );
  const [ showShare, setShowShare ] = useState( false );
  const [ filters, setFilters ] = useState({
    category: "",
    subCategory: "",
    region: "",
    inkhundla: "",
    town: "",
    turnover: "",
    numberOfEmployees: "",
    yearOfEstablishment: "",
    businessType: "",
    isDisabilityOwned: "",
    ownershipType: "",
    ownership: "",
    ownerGender: "",
    ruralUrbanClassification: "",
    keyword: "",
    sort: "",
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);



  const handleFilterSubmit = async ( e ) => {
    if ( e ) {
      e.preventDefault();
    }
    const params = new URLSearchParams( searchParams.toString() );
    if ( params.has( "region" ) ) params.delete( "region" );
    if ( params.has( "keyword" ) ) params.delete( "keyword" );
    if ( params.has( "categoryId" ) ) params.delete( "categoryId" );
    router.replace( `?${params.toString()}`, { scroll: false, shallow: true } );
    try {
      setLoading( true );
      console.log( filters );
      const response = await getBusinessListfilter( filters, 1, 20 )
      if ( response?.values?.rows ) {
        setBusinesses( response.values.rows );
        setTotal( response.total )
      }
    } catch ( error ) {
      console.log( "Error", error )
    } finally {
      setLoading( false );
    }
  };



  const fetchBusinesses = async () => {
    if ( categoryId ) {
      setFilters( prev => ( { ...prev, category: categoryId } ) );
    }
    try {
      setLoading( true );
      const response = await getBusinessListByCategoryId( categoryId );
      if ( response?.values?.rows ) {
        setBusinesses( response.values.rows );
        setTotal( response.total )
        const params = new URLSearchParams( searchParams.toString() );
        // if ( params.has( "region" ) ) params.delete( "region" );
        // if ( params.has( "keyword" ) ) params.delete( "keyword" );
        // if ( params.has( "categoryId" ) ) params.delete( "categoryId" );

        router.replace( `?${params.toString()}`, { scroll: false, shallow: true } );
      }
    } catch ( err ) {
      console.error( 'Error fetching businesses:', err );
      setError( 'Failed to load businesses' );
    } finally {
      setLoading( false );
    }
  };

  useEffect( () => {
    const fetchBusinessesByregion = async () => {
      if ( region ) {
        setFilters( prev => ( { ...prev, region } ) );
      }
      try {
        setLoading( true );
        const response = await getBusinessListByregion( region, 1, 100 );
        if ( response?.values?.rows ) {
          setBusinesses( response.values.rows );
          setTotal( response.total )
          // const params = new URLSearchParams(searchParams.toString());
          // if (params.has("region")) params.delete("region");
          // if (params.has("keyword")) params.delete("keyword");

          // router.replace(`?${params.toString()}`, { scroll: false, shallow: true });
        }
      } catch ( err ) {
        console.error( 'Error fetching businesses:', err );
        setError( 'Failed to load businesses' );
      } finally {
        setLoading( false );
      }
    };
    const fetchBusinessesBykeyword = async () => {

      try {
        setLoading( true );
        console.log( "first" )
        const response = await getBusinessListByKeyword( keyword );
        console.log( response )
        if ( response ) {
          setBusinesses( response );
          setTotal( response.length )
          // const params = new URLSearchParams(searchParams.toString());
          // if (params.has("region")) params.delete("region");
          // if (params.has("keyword")) params.delete("keyword");
          // router.replace(`?${params.toString()}`, { scroll: false, shallow: true });
        }
      } catch ( err ) {
        console.error( 'Error fetching businesses:', err );
        setError( 'Failed to load businesses' );
      } finally {
        setLoading( false );
      }
    };
    const fetchCategories = async () => {
      try {
        setLoading( true );
        const response = await getBusinessCategoryList( 1, 10 );
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
    if ( region && region != undefined ) {
      fetchBusinessesByregion();
    } else if ( keyword && keyword != undefined ) {
      fetchBusinessesBykeyword();
    } else if ( categoryId ) {
      fetchBusinesses();
    }else{
     handleFilterSubmit()
    }
  }, [ categoryId, region, keyword ] );

  // Add new useEffect for sub-categories
  useEffect( () => {
    const fetchSubCategories = async () => {
      if ( filters.category ) {
        try {
          const response = await getBusinessSubCategoryList( filters.category );
          if ( response?.values?.rows ) {
            setSubCategories( response.values.rows );
          }
        } catch ( err ) {
          console.error( 'Error fetching sub-categories:', err );
        }
      } else {
        setSubCategories( [] );
      }
    };

    fetchSubCategories();
  }, [ filters.category ] );

  const handleFilterChange = ( e ) => {
    const { name, value } = e.target;
    if ( name === 'category' ) {
      setFilters( prev => ( {
        ...prev,
        category: value,
        subCategory: '' // Reset sub-category when category changes
      } ) );
    } else if ( name === 'region' ) {
      setFilters( prev => ( {
        ...prev,
        region: value,
        inkhundla: '' // Reset inkhundla when region changes
      } ) );
    } else {
      setFilters( prev => ( {
        ...prev,
        [ name ]: value
      } ) );
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: "",
      subCategory: "",
      region: "",
      inkhundla: "",
      town: "",
      turnover: "",
      numberOfEmployees: "",
      yearOfEstablishment: "",
      businessType: "",
      isRegistered: "",
      isDisabilityOwned: "",
      ownershipType: "",
      ownership: "",
      ownerGender: "",
      ruralUrbanClassification: "",
      keyword: "",
      sort: ""
    });
    setSubCategories([]);
  };




  return (
    <>
      <div className="bg-gray-450 pb-10">
        <div className="category_bg h-[600px] w-full relative">
        </div>
        <div className="pt-16 px-8">
          <div className="">
            <h1 className="text-3xl md:text-4xl text-gray-800 py-3 font-bold text-center">Total <span className="text-gray-600">{ total }</span>  Records found</h1>
          </div>
          <div className="flex flex-col   mx-auto justify-center lg:flex-row gap-6 p-4 mt-12">
            {/* Sidebar - Advance Search */ }
{/* Sidebar - Advanced Search */}
<div className="w-full shadow-lg h-fit shadow-black/25 lg:w-1/4 space-y-10">
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-lg font-bold mb-4">Search</h2>
    <form onSubmit={handleFilterSubmit} className="space-y-4 text-sm">
      
      {/* Keyword Search */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Search Keyword</label>
        <input
          type="text"
          name="keyword"
          value={filters.keyword}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Search businesses..."
        />
      </div>

      {/* Advanced Search Toggle Button */}
      <button
        type="button"
        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-between transition-colors"
      >
        <span>{showAdvancedSearch ? "Hide Advanced Search" : "Advanced Search"}</span>
        <span className={`transform transition-transform ${showAdvancedSearch ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Advanced Filters - Conditionally rendered */}
      {showAdvancedSearch && (
        <>

      {/* Category Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Categories</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-Category Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Sub-Categories</label>
        <select
          name="subCategory"
          value={filters.subCategory}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
          disabled={!filters.category}
        >
          <option value="">All Sub-Categories</option>
          {subCategories.length !== 0 ? (
            subCategories.map((subCategory) => (
              <option key={subCategory.id} value={subCategory.id}>
                {subCategory.name}
              </option>
            ))
          ) : (
            <option value="" disabled>Select category first</option>
          )}
        </select>
      </div>

      {/* Region Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Region</label>
        <select
          name="region"
          value={filters.region}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All Regions</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Inkhundla Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Inkhundla</label>
        <select
          name="inkhundla"
          value={filters.inkhundla}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
          disabled={!filters.region}
        >
          <option value="">All Inkhundla</option>
          {filters.region && TINKHUNDLA[filters.region] ? (
            TINKHUNDLA[filters.region].map((inkhundla) => (
              <option key={inkhundla} value={inkhundla}>
                {inkhundla}
              </option>
            ))
          ) : (
            <option value="" disabled>Select region first</option>
          )}
        </select>
      </div>

      {/* Annual Turnover Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Annual Turnover</label>
        <select
          name="turnover"
          value={filters.turnover}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All Turnovers</option>
          {TURNOVER_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Number of Employees Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Number of Employees</label>
        <select
          name="numberOfEmployees"
          value={filters.numberOfEmployees}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All Sizes</option>
          {EMPLOYEE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Year of Establishment */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Established Year</label>
        <input
          type="number"
          name="yearOfEstablishment"
          value={filters.yearOfEstablishment}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., 2020"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>

      {/* Ownership Type Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Ownership Type</label>
        <select
          name="ownershipType"
          value={filters.ownershipType}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All Types</option>
          {OWNERSHIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Registration Status Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Registration Status</label>
        <select
          name="isRegistered"
          value={filters.isRegistered}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All</option>
          <option value="yes">Registered</option>
          <option value="no">Not Registered</option>
        </select>
      </div>

      {/* Disability Owned Filter */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Disability Owned</label>
        <select
          name="isDisabilityOwned"
          value={filters.isDisabilityOwned}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      {/* Owner Gender */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Owner Gender</label>
        <select
          name="ownerGender"
          value={filters.ownerGender}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All</option>
          {OWNER_GENDERS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Rural / Urban Classification */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Rural/Urban</label>
        <select
          name="ruralUrbanClassification"
          value={filters.ruralUrbanClassification}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All</option>
          {RURAL_URBAN.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Ownership (Individual/Partnership) */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Ownership</label>
        <select
          name="ownership"
          value={filters.ownership}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">All</option>
          <option value="Individual">Individual</option>
          <option value="Partnership">Partnership</option>
        </select>
      </div>

      {/* Town */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Town</label>
        <input
          type="text"
          name="town"
          value={filters.town}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., Mbabane"
        />
      </div>

      {/* Sort */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Sort By</label>
        <select
          name="sort"
          value={filters.sort}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Default</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="relevance">Relevance</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>

        </>
      )}

      {/* Submit and Reset Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleResetFilters}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>
    </form>
  </div>
</div>


            {/* Business Listings */ }
            <div className="w-full lg:w-3/4 space-y-10">
              { loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center">{ error }</div>
              ) : businesses.length === 0 ? (
                <p className="text-center text-gray-500">No businesses found.</p>
              ) : (
                <>
                  <div className="flex flex-row bg-white items-center justify-between p-8 rounded-lg shadow-lg shadow-black/15 font-medium text-gray-500">
                    <span>Showing { businesses.length } results</span>
                    <span>A to Z (title)</span>
                  </div>
                  { businesses.map( ( biz ) => (
                    <div
                      key={ biz.id }
                      className="flex flex-col shadow-lg md:flex-row p-10 gap-5 bg-white rounded-lg shadow-black/25 overflow-hidden"
                    >
                      <div className="relative w-full md:w-1/3 h-64 rounded-md overflow-hidden">
                        {/* Category tag - Top-left */ }
                        <div className="flex flex-row items-center z-20 bg-white px-3 py-2 absolute top-4 left-4 rounded-lg text-sm gap-2 shadow">
                          <span className="text-primary">
                            <LuBuilding2 size={ 20 } />
                          </span>
                          <span>{ biz.business_category_name }</span>
                        </div>
                        {/* Business Sub-category Name */ }
                        { biz.business_sub_category_name && (
                          <div className="flex flex-row items-center z-20 bg-white px-3 py-2 absolute top-16 left-4 rounded-lg text-sm gap-2 shadow">
                            <span className="text-primary">
                              <TbCategoryPlus size={ 20 } />
                            </span>
                            <span>{ biz?.business_sub_category_name }</span>
                          </div>
                        ) }
                        {/* Business Image */ }
                        <Link href={ `/categories/detailed-page/${biz.id}` }>
                          <Image
                            src={ `${biz.business_image_url ? `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${biz.business_image_url}` : "/images/logo_msme.png"}` }
                            alt={ biz.name_of_organization }
                            fill
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        {/* Registration badge - Bottom-right */ }
                        <div className={ `absolute bottom-10 right-0 px-3 py-1 text-md font-medium text-white ${biz.business_type === 'Registered' ? "bg-green-600" : "bg-red-600"
                          }` }>
                          { biz.business_type }
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-4 flex-1">
                        <div>
                          <Link href={ `/categories/detailed-page/${biz.id}` } className="text-blue-750 font-bold text-2xl">
                            { biz.name_of_organization }
                          </Link>
                          <p className="text-gray-600 text-sm mb-1 py-2">
                            { biz.brief_company_description
                              ? biz.brief_company_description.split( ' ' ).slice( 0, 20 ).join( ' ' ) +
                              ( biz.brief_company_description.split( ' ' ).length > 20 ? '...' : '' )
                              : '' }
                          </p>
                          <span className="text-gray-600 text-sm items-center py-5 flex flex-row gap-2">
                            <p className="text-blue-750"><IoLocationSharp size={ 18 } /></p>
                            { biz.street_address }, { biz.town }, { biz.region }
                          </span>
                          <div className="text-gray-600 text-sm text-center items-center flex flex-row gap-2 justify-between">
                            <div className="flex flex-row gap-2">
                              <p className="text-blue-750"><SlCallOut size={ 18 } /></p>
                              { biz.contact_number }
                            </div>
                          </div>
                        </div>
                        <hr className="text-primary/20 mt-5" />
                        <div className="flex flex-row items-center w-full justify-end gap-3 mt-2"
                          onMouseLeave={ () => setShowShare( false ) }
                        >
                          { showShare &&
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex gap-2">
                                <FacebookShareButton url={ `http://16.171.65.248:3000/categories/detailed-page/${biz.id}` } quote={ biz.name_of_organization }>
                                  <FacebookIcon size={ 32 } round />
                                </FacebookShareButton>

                                <TwitterShareButton url={ `http://16.171.65.248:3000/categories/detailed-page/${biz.id}` } quote={ biz.name_of_organization }>
                                  <TwitterIcon size={ 32 } round />
                                </TwitterShareButton>

                                <WhatsappShareButton url={ `http://16.171.65.248:3000/categories/detailed-page/${biz.id}` } quote={ biz.name_of_organization }>
                                  <WhatsappIcon size={ 32 } round />
                                </WhatsappShareButton>
                              </div>
                            </div>
                          }
                          <button className="text-white p-3 rounded-md bg-primary cursor-pointer"
                            onMouseEnter={ () => setShowShare( true ) }
                          >
                            <IoShareSocialSharp size={ 18 } />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) ) }
                </>
              ) }
            </div>
          </div>
        </div>
      </div>
      <Partners />
    </>
  );
};

export default Page