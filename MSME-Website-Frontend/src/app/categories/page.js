"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { IoLocationSharp, IoShareSocialSharp } from "react-icons/io5";
import { SlCallOut } from "react-icons/sl";
import { LuBuilding2 } from "react-icons/lu";
import { TbCategoryPlus } from "react-icons/tb";
import Partners from "@/components/Partners";
import Link from "next/link";
import { getBusinessCategoryList, getBusinessListByCategoryId, getBusinessListByKeyword, getBusinessListByregion, getBusinessListfilter, getBusinessSubCategoryList, getAutocompleteSuggestions, getPopularSearches } from "@/apis/business-category-api";
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
import { highlightSearchTerms, getSearchSnippet } from "@/utils/search-highlight";

// =============================================================================
// RECENT SEARCHES - localStorage utility
// =============================================================================
const RECENT_SEARCHES_KEY = 'msme_recent_searches';
const MAX_RECENT_SEARCHES = 8;

const getRecentSearches = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (term) => {
  if (!term || term.trim().length < 2 || typeof window === 'undefined') return;
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
    const updated = [term.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

const clearRecentSearches = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
};

// =============================================================================
// DEBOUNCE HOOK
// =============================================================================
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

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
  // Search terms for highlighting - populated from API response or URL keyword
  const [ searchTerms, setSearchTerms ] = useState( [] );
  
  // Autocomplete state
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState({ categories: [], locations: [] });
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Pagination state - responsive page size based on screen width
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(8); // Default for desktop
  
  // Detect screen size and set appropriate page size
  useEffect(() => {
    const updatePageSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile: 3 items per page
        setPageSize(3);
      } else if (width < 1024) {
        // Tablet: 6 items per page
        setPageSize(6);
      } else {
        // Desktop: 8 items per page
        setPageSize(8);
      }
    };
    
    // Set initial page size
    updatePageSize();
    
    // Update on resize
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);
  
  // Re-fetch when pageSize changes (responsive pagination)
  useEffect(() => {
    if (total && total > 0) {
      // Recalculate total pages with new page size
      setTotalPages(Math.ceil(total / pageSize));
      // Reset to page 1 if current page would be out of bounds
      const newTotalPages = Math.ceil(total / pageSize);
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    }
  }, [pageSize, total]);
  
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Debounce keyword for autocomplete (300ms delay)
  const debouncedKeyword = useDebounce(filters.keyword, 300);
  
  // Load recent and popular searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    getPopularSearches().then(data => {
      setPopularSearches(data);
    }).catch(() => {});
  }, []);
  
  // Fetch autocomplete suggestions when debounced keyword changes
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (debouncedKeyword && debouncedKeyword.length >= 2) {
        setAutocompleteLoading(true);
        try {
          const data = await getAutocompleteSuggestions(debouncedKeyword);
          setAutocompleteResults(data.suggestions || []);
        } catch {
          setAutocompleteResults([]);
        } finally {
          setAutocompleteLoading(false);
        }
      } else {
        setAutocompleteResults([]);
      }
    };
    fetchAutocomplete();
  }, [debouncedKeyword]);
  
  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Sync filters to URL when they change
  const syncFiltersToUrl = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    // Only add non-empty filters to URL
    if (newFilters.keyword) params.set('keyword', newFilters.keyword);
    if (newFilters.category) params.set('categoryId', newFilters.category);
    if (newFilters.subCategory) params.set('subCategoryId', newFilters.subCategory);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.inkhundla) params.set('inkhundla', newFilters.inkhundla);
    if (newFilters.town) params.set('town', newFilters.town);
    if (newFilters.turnover) params.set('turnover', newFilters.turnover);
    if (newFilters.numberOfEmployees) params.set('employees', newFilters.numberOfEmployees);
    if (newFilters.businessType) params.set('businessType', newFilters.businessType);
    if (newFilters.ownershipType) params.set('ownershipType', newFilters.ownershipType);
    if (newFilters.ownerGender) params.set('ownerGender', newFilters.ownerGender);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    
    const queryString = params.toString();
    // Always use full path to avoid navigation issues
    const newUrl = `/categories${queryString ? `?${queryString}` : ''}`;
    
    // Only update URL if it's actually different to prevent unnecessary re-renders
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [router]);

  // Handle autocomplete suggestion click
  const handleSuggestionClick = (suggestion) => {
    setShowAutocomplete(false);
    
    if (suggestion.type === 'business') {
      // Navigate directly to business page
      router.push(`/categories/detailed-page/${suggestion.id}`);
    } else {
      // Use suggestion text as search keyword
      const newKeyword = suggestion.text;
      setFilters(prev => ({ ...prev, keyword: newKeyword }));
      saveRecentSearch(newKeyword);
      setRecentSearches(getRecentSearches());
      // Trigger search
      setTimeout(() => handleFilterSubmit(null, { keyword: newKeyword }), 100);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (term) => {
    setFilters(prev => ({ ...prev, keyword: term }));
    setShowAutocomplete(false);
    setTimeout(() => handleFilterSubmit(null, { keyword: term }), 100);
  };

  // Helper to render highlighted text safely
  const renderHighlighted = (text, maxWords = 0) => {
    if (!text) return '';
    let displayText = text;
    if (maxWords > 0) {
      const words = text.split(' ');
      displayText = words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
    }
    if (searchTerms.length > 0) {
      return <span dangerouslySetInnerHTML={{ __html: highlightSearchTerms(displayText, searchTerms) }} />;
    }
    return displayText;
  };


  const handleFilterSubmit = async ( e, overrideFilters = {} ) => {
    if ( e ) {
      e.preventDefault();
    }
    
    // Merge current filters with any overrides (for autocomplete clicks)
    const searchFilters = { ...filters, ...overrideFilters };
    
    // Save keyword to recent searches
    if (searchFilters.keyword && searchFilters.keyword.trim().length >= 2) {
      saveRecentSearch(searchFilters.keyword);
      setRecentSearches(getRecentSearches());
    }
    
    // Sync filters to URL for shareable links
    syncFiltersToUrl(searchFilters);
    setShowAutocomplete(false);
    
    try {
      setLoading( true );
      setCurrentPage(1); // Reset to first page on new search
      console.log('🔍 Searching with filters:', searchFilters);
      const response = await getBusinessListfilter( searchFilters, 1, pageSize );
      if ( response?.values?.rows ) {
        setBusinesses( response.values.rows );
        const totalCount = response.total || response.values.count;
        setTotal( totalCount );
        setTotalPages(Math.ceil(totalCount / pageSize));
        // Capture search terms from API response for highlighting
        if ( response.searchMeta?.terms ) {
          setSearchTerms( response.searchMeta.terms );
        } else if ( searchFilters.keyword ) {
          // Fallback: extract terms from filter keyword
          setSearchTerms( searchFilters.keyword.trim().toLowerCase().split(/\s+/) );
        } else {
          setSearchTerms( [] );
        }
      }
    } catch ( error ) {
      console.log( "Error", error )
      setSearchTerms( [] );
    } finally {
      setLoading( false );
    }
  };
  
  // Handle page change
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    try {
      setLoading(true);
      const response = await getBusinessListfilter(filters, newPage, pageSize);
      if (response?.values?.rows) {
        setBusinesses(response.values.rows);
        setCurrentPage(newPage);
        // Scroll to results
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
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
    // Enhanced keyword search using filters API (searches 17+ fields)
    const fetchBusinessesBykeyword = async () => {
      try {
        setLoading( true );
        // Use filters API for multi-field keyword search instead of single-field search
        const response = await getBusinessListfilter({ keyword }, 1, 100);
        if ( response?.values?.rows ) {
          setBusinesses( response.values.rows );
          setTotal( response.total || response.values.count );
          // Update filter state so keyword shows in search box
          setFilters( prev => ( { ...prev, keyword } ) );
          // Set search terms for highlighting
          if ( response.searchMeta?.terms ) {
            setSearchTerms( response.searchMeta.terms );
          } else {
            setSearchTerms( keyword.trim().toLowerCase().split(/\s+/) );
          }
        }
      } catch ( err ) {
        console.error( 'Error fetching businesses:', err );
        setError( 'Failed to load businesses' );
        setSearchTerms( [] );
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

  // Get active filters for display (excluding keyword which is shown separately)
  const getActiveFilters = () => {
    const filterLabels = {
      category: 'Category',
      subCategory: 'Sub-Category',
      region: 'Region',
      inkhundla: 'Inkhundla',
      town: 'Town',
      turnover: 'Turnover',
      numberOfEmployees: 'Employees',
      yearOfEstablishment: 'Est. Year',
      businessType: 'Business Type',
      isRegistered: 'Registration',
      isDisabilityOwned: 'Disability Owned',
      ownershipType: 'Ownership Type',
      ownership: 'Owner Type',
      ownerGender: 'Owner Gender',
      ruralUrbanClassification: 'Location Type',
      sort: 'Sort By'
    };

    const activeFilters = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'keyword' && filterLabels[key]) {
        // Get display value
        let displayValue = value;
        if (key === 'category') {
          const cat = categories.find(c => c.id.toString() === value.toString());
          displayValue = cat?.name || value;
        } else if (key === 'subCategory') {
          const subCat = subCategories.find(c => c.id.toString() === value.toString());
          displayValue = subCat?.name || value;
        } else if (key === 'isDisabilityOwned' || key === 'isRegistered') {
          displayValue = value === 'yes' ? 'Yes' : 'No';
        }
        activeFilters.push({
          key,
          label: filterLabels[key],
          value: displayValue
        });
      }
    });
    return activeFilters;
  };

  // Remove a specific filter
  const removeFilter = (filterKey) => {
    if (filterKey === 'category') {
      setFilters(prev => ({ ...prev, category: '', subCategory: '' }));
      setSubCategories([]);
    } else if (filterKey === 'region') {
      setFilters(prev => ({ ...prev, region: '', inkhundla: '' }));
    } else {
      setFilters(prev => ({ ...prev, [filterKey]: '' }));
    }
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0 || filters.keyword;

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
    setSearchTerms([]); // Clear search highlighting
  };




  return (
    <>
      <div className="bg-gray-450 pb-10">
        <div className="category_bg h-[400px] w-full relative">
          {/* Hero Image Overlay */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="pt-8 px-8">
          <div className="">
            <h2 className="text-2xl md:text-3xl text-gray-800 py-3 font-bold text-center">
              {searchTerms.length > 0 ? (
                <>Results for &quot;<span className="text-primary">{filters.keyword}</span>&quot; — <span className="text-gray-600">{total}</span> businesses found</>
              ) : (
                <>Total <span className="text-gray-600">{total}</span> Records found</>
              )}
            </h2>
            {searchTerms.length > 0 && (
              <p className="text-center text-gray-500 text-sm mb-4">
                Searching across: business names, categories, services, products, descriptions & locations
              </p>
            )}
          </div>
          
          {/* Mobile Filter Toggle Button - Only visible on small screens */}
          <div className="lg:hidden px-4 mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg flex items-center justify-center gap-2 font-medium"
            >
              <span>⚙️</span>
              Filters & Search
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                  {activeFilters.length + (filters.keyword ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col mx-auto justify-center lg:flex-row gap-6 p-4 mt-6">
            {/* Mobile Filter Drawer Overlay */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                {/* Backdrop */}
                <div 
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setShowMobileFilters(false)}
                />
                {/* Drawer */}
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold">Filters & Search</h2>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-full text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4">
                    {/* Mobile filter form - Same content as sidebar */}
                    <form onSubmit={(e) => { handleFilterSubmit(e); setShowMobileFilters(false); }} className="space-y-4 text-sm">
                      {/* Search Box */}
                      <div className="text-base">
                        <label className="block py-2 font-bold text-gray-800 mb-1">Search</label>
                        <input
                          type="text"
                          name="keyword"
                          value={filters.keyword}
                          onChange={handleFilterChange}
                          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          placeholder="Name, service, product, location..."
                        />
                      </div>
                      
                      {/* Active Filters */}
                      {hasActiveFilters && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 uppercase">Active Filters</span>
                            <button type="button" onClick={handleResetFilters} className="text-xs text-red-500">Clear All</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {filters.keyword && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                Search: {filters.keyword}
                                <button type="button" onClick={() => { setFilters(prev => ({ ...prev, keyword: '' })); setSearchTerms([]); }}>✕</button>
                              </span>
                            )}
                            {activeFilters.map((filter) => (
                              <span key={filter.key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                {filter.label}: {filter.value}
                                <button type="button" onClick={() => removeFilter(filter.key)}>✕</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Category */}
                      <div>
                        <label className="block py-2 font-bold text-gray-800">Category</label>
                        <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full p-2.5 border-2 border-gray-200 rounded-lg">
                          <option value="">All Categories</option>
                          {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                      </div>
                      
                      {/* Sub-Category */}
                      {filters.category && subCategories.length > 0 && (
                        <div>
                          <label className="block py-2 font-bold text-gray-800">Sub-Category</label>
                          <select name="subCategory" value={filters.subCategory} onChange={handleFilterChange} className="w-full p-2.5 border-2 border-gray-200 rounded-lg">
                            <option value="">All Sub-Categories</option>
                            {subCategories.map((sub) => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                          </select>
                        </div>
                      )}
                      
                      {/* Region */}
                      <div>
                        <label className="block py-2 font-bold text-gray-800">Region</label>
                        <select name="region" value={filters.region} onChange={handleFilterChange} className="w-full p-2.5 border-2 border-gray-200 rounded-lg">
                          <option value="">All Regions</option>
                          {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                        </select>
                      </div>
                      
                      {/* Owner Gender */}
                      <div>
                        <label className="block py-2 font-bold text-gray-800">Owner Gender</label>
                        <select name="ownerGender" value={filters.ownerGender} onChange={handleFilterChange} className="w-full p-2.5 border-2 border-gray-200 rounded-lg">
                          <option value="">All</option>
                          {OWNER_GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
                        </select>
                      </div>
                      
                      {/* Sort */}
                      <div>
                        <label className="block py-2 font-bold text-gray-800">Sort By</label>
                        <select name="sort" value={filters.sort} onChange={handleFilterChange} className="w-full p-2.5 border-2 border-gray-200 rounded-lg">
                          <option value="">Default</option>
                          <option value="relevance">Most Relevant</option>
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name_asc">A to Z</option>
                          <option value="name_desc">Z to A</option>
                        </select>
                      </div>
                      
                      {/* Submit buttons */}
                      <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-4">
                        <button type="button" onClick={() => { handleResetFilters(); setShowMobileFilters(false); }} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium">
                          Reset
                        </button>
                        <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-lg font-medium">
                          Apply Filters
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sidebar - Advanced Search (Hidden on mobile) */}
<div className="hidden lg:block w-full shadow-lg h-fit shadow-black/25 lg:w-1/4 space-y-10">
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
      <span>🔍</span> Search Businesses
    </h2>
    <form onSubmit={handleFilterSubmit} className="space-y-4 text-sm">
      
      {/* Main Search Box */}
      <div className="text-base">
        <label className="block py-2 font-bold text-gray-800 mb-1">Search</label>
        <div className="relative">
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleFilterChange}
            className="w-full p-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            placeholder="Name, service, product, location..."
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, keyword: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Searches: name, category, services, products, description, town, region
        </p>
      </div>

      {/* Active Filters Display - Shows applied filters as removable tags */}
      {hasActiveFilters && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Active Filters</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.keyword && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                <span className="font-medium">Search:</span> {filters.keyword}
                <button
                  type="button"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, keyword: '' }));
                    setSearchTerms([]);
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  ✕
                </button>
              </span>
            )}
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                <span className="font-medium">{filter.label}:</span> {filter.value}
                <button
                  type="button"
                  onClick={() => removeFilter(filter.key)}
                  className="ml-1 hover:text-red-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Search Button */}
      <button
        type="submit"
        className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Search Businesses
      </button>

      {/* Advanced Search Toggle Button */}
      <button
        type="button"
        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-between transition-colors"
      >
        <span>
          {showAdvancedSearch ? "Hide Filters" : "Add Filters"}
          {!showAdvancedSearch && activeFilters.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
              {activeFilters.length}
            </span>
          )}
        </span>
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
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No businesses found</h3>
                  
                  {filters.keyword ? (
                    <p className="text-gray-600 mb-4">
                      We couldn&apos;t find any businesses matching &quot;<span className="font-semibold">{filters.keyword}</span>&quot;
                      {activeFilters.length > 0 && ' with the selected filters'}.
                    </p>
                  ) : activeFilters.length > 0 ? (
                    <p className="text-gray-600 mb-4">
                      No businesses match your current filter selection.
                    </p>
                  ) : (
                    <p className="text-gray-600 mb-4">
                      No businesses are currently available.
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    {/* Suggestions */}
                    <div className="text-sm text-gray-500">
                      <p className="font-medium mb-2">Try:</p>
                      <ul className="space-y-1">
                        {filters.keyword && <li>• Using different or broader keywords</li>}
                        {activeFilters.length > 0 && <li>• Removing some filters</li>}
                        <li>• Checking for spelling errors</li>
                        <li>• Browsing by category instead</li>
                      </ul>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {(filters.keyword || activeFilters.length > 0) && (
                        <button
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          Clear All Filters
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setFilters(prev => ({ ...prev, keyword: '' }));
                          handleFilterSubmit(null, { keyword: '' });
                        }}
                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                      >
                        Browse All Businesses
                      </button>
                    </div>
                    
                    {/* Popular categories */}
                    {popularSearches.categories?.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">Popular categories:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {popularSearches.categories.slice(0, 5).map((cat, i) => (
                            <button
                              key={i}
                              onClick={() => handleRecentSearchClick(cat.text)}
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-full transition-colors"
                            >
                              {cat.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row bg-white items-center justify-between p-4 sm:p-8 rounded-lg shadow-lg shadow-black/15 font-medium text-gray-500 gap-3">
                    <span>
                      Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total} results
                    </span>
                    <span className="text-sm">
                      {filters.sort === 'newest' && '📅 Newest first'}
                      {filters.sort === 'oldest' && '📅 Oldest first'}
                      {filters.sort === 'name_asc' && '🔤 A to Z'}
                      {filters.sort === 'name_desc' && '🔤 Z to A'}
                      {filters.sort === 'relevance' && searchTerms.length > 0 && '⭐ Most relevant'}
                      {(!filters.sort || (filters.sort === 'relevance' && !searchTerms.length)) && (
                        searchTerms.length > 0 ? '⭐ Most relevant' : '📅 Newest first'
                      )}
                    </span>
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
                          <span>{ renderHighlighted(biz.business_category_name) }</span>
                        </div>
                        {/* Business Sub-category Name */ }
                        { biz.business_sub_category_name && (
                          <div className="flex flex-row items-center z-20 bg-white px-3 py-2 absolute top-16 left-4 rounded-lg text-sm gap-2 shadow">
                            <span className="text-primary">
                              <TbCategoryPlus size={ 20 } />
                            </span>
                            <span>{ renderHighlighted(biz?.business_sub_category_name) }</span>
                          </div>
                        ) }
                        {/* Business Image */ }
                        <Link href={ `/categories/detailed-page/${biz.id}` } className="relative block w-full h-full">
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
                            { renderHighlighted(biz.name_of_organization) }
                          </Link>
                          <p className="text-gray-600 text-sm mb-1 py-2">
                            { renderHighlighted(biz.brief_company_description, 20) }
                          </p>
                          
                          {/* Services & Products - Show when they contain search terms */}
                          {searchTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2 my-2">
                              {biz.service_offered && searchTerms.some(t => biz.service_offered?.toLowerCase().includes(t)) && (
                                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  <span className="font-semibold">Services:</span> {renderHighlighted(biz.service_offered?.slice(0, 60) + (biz.service_offered?.length > 60 ? '...' : ''))}
                                </div>
                              )}
                              {biz.product_offered && searchTerms.some(t => biz.product_offered?.toLowerCase().includes(t)) && (
                                <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                  <span className="font-semibold">Products:</span> {renderHighlighted(biz.product_offered?.slice(0, 60) + (biz.product_offered?.length > 60 ? '...' : ''))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <span className="text-gray-600 text-sm items-center py-3 flex flex-row gap-2">
                            <p className="text-blue-750"><IoLocationSharp size={ 18 } /></p>
                            { renderHighlighted(biz.street_address) }, { renderHighlighted(biz.town) }, { renderHighlighted(biz.region) }
                          </span>
                          <div className="text-gray-600 text-sm text-center items-center flex flex-row gap-2 justify-between">
                            <div className="flex flex-row gap-2">
                              <p className="text-blue-750"><SlCallOut size={ 18 } /></p>
                              { biz.contact_number }
                            </div>
                          </div>
                          
                          {/* Match indicators - show which fields matched */}
                          {searchTerms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              <span className="text-xs text-gray-400">Matched in:</span>
                              {searchTerms.some(t => biz.name_of_organization?.toLowerCase().includes(t)) && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">name</span>
                              )}
                              {searchTerms.some(t => biz.business_category_name?.toLowerCase().includes(t)) && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">category</span>
                              )}
                              {searchTerms.some(t => biz.service_offered?.toLowerCase().includes(t)) && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">services</span>
                              )}
                              {searchTerms.some(t => biz.product_offered?.toLowerCase().includes(t)) && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">products</span>
                              )}
                              {searchTerms.some(t => biz.brief_company_description?.toLowerCase().includes(t)) && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">description</span>
                              )}
                              {searchTerms.some(t => (biz.town?.toLowerCase().includes(t) || biz.region?.toLowerCase().includes(t))) && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">location</span>
                              )}
                            </div>
                          )}
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
                  
                  {/* Pagination UI */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-lg mt-6">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages} ({total} total results)
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Previous button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        
                        {/* Page numbers */}
                        <div className="flex gap-1">
                          {/* First page */}
                          {currentPage > 3 && (
                            <>
                              <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
                              >
                                1
                              </button>
                              {currentPage > 4 && <span className="px-2 py-2">...</span>}
                            </>
                          )}
                          
                          {/* Pages around current */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                            .map(page => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded border ${
                                  page === currentPage
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            ))
                          }
                          
                          {/* Last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <span className="px-2 py-2">...</span>}
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Next button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
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