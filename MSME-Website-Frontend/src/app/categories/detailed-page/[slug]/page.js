"use client"
import AboutSection from "@/components/detailsPage/AboutSection";
import ContactSection from "@/components/detailsPage/ContactSection";
import DirectorSection from "@/components/detailsPage/DirectorSection";
import Partners from "@/components/Partners";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaRegPaperPlane, FaUserAlt } from "react-icons/fa";
import { FaPhone, FaRegUser } from "react-icons/fa6";
import { RiInfoCardLine } from "react-icons/ri";
import { getBusinessDetailsById } from "@/apis/add-business-api";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { MdEmail } from "react-icons/md";
import { useAuth } from "@/context/AuthContext";
const Page = () => {
  const { slug } = useParams();
  const { userType } = useAuth();
  const [ activeTab, setActiveTab ] = useState( "about" );
  const [ isLoading, setIsLoading ] = useState(false);
  const [ businessDetails, setBusinessDetails ] = useState({
      name_of_organization: "",
      brief_company_description: "",
      business_category_id: "",
      business_category_name: "",
      business_sub_category_name: "",
      service_offered: "",
      product_offered: "",
      business_type: "",
      disability_owned: "",
      turnover: "",
      establishment_year: "",
      employees: "",
      contact_number: "",
      email_address: "",
      street_address: "",
      lat:"",
      longe:"",
      town: "",
      region: "",
      primary_contact_name: "",
      primary_contact_number: "",
      primary_contact_email: "",
      business_profile_url: "",
      business_image_url: "",
      incorporation_image_url: "",
      is_verified: ""
  });
  const [ directorsList, setDirectorsList ] = useState([]);

  const fetchCurrentBusinessDetailById = async() => {
    try {
      setIsLoading(true);
      const response = await getBusinessDetailsById( slug );
      if ( response?.msmeDetails ) {
        const { msmeDetails, directorsDetail } = response;
        
        setBusinessDetails({
          ...msmeDetails,
          password: undefined
        });
        setDirectorsList(directorsDetail || []);
      }
      setIsLoading(false);
    } catch ( err ) {
      console.error( 'Error fetching business details:', err );
      toast.error('Failed to fetch business details. Please try again.');
    }
  };

  useEffect(()=> {
    fetchCurrentBusinessDetailById();
  }, []);

  return (
    <div className="relative bg-[url('/images/Details_page/detail-page-banner.png')] w-full bg-cover bg-center">
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Details sections */ }
          <div className=" flex justify-center relative w-full pt-12 mb-10 rounded-lg">
            <div className="max-w-[76rem] mx-auto relative">
              {/* Left navigation */ }
              <div className="hidden lg:block absolute top-0 left-0 max-w-[5rem] max-h-[16.85rem] bg-white text-black shadow-xl rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={ `w-full hover:text-primary transition cursor-pointer` }
                    onClick={ () => setActiveTab( "about" ) }
                  >
                    <div className={ `${activeTab === "about" && "text-primary"} flex flex-col justify-center items-center border-b border-black py-5 px-2 gap-1` }>
                      <FaRegUser size={ 25 } />
                      <span className="text-sm">About</span>
                    </div>
                  </div>
                  <div
                    className={ `w-full hover:text-primary transition cursor-pointer` }
                    onClick={ () => setActiveTab( "director" ) }
                  >
                    <div className={ `${activeTab === "director" && "text-primary"} flex flex-col justify-center items-center border-b border-gray-400 py-5 px-2 gap-1` }>
                      <RiInfoCardLine size={ 25 } />
                      <span className="text-sm">Directors</span>
                    </div>
                  </div>
                  <div
                    className={ `w-full hover:text-primary transition cursor-pointer` }
                    onClick={ () => setActiveTab( "contact" ) }
                  >
                    <div className={ `${activeTab === "contact" && "text-primary"} flex flex-col justify-center items-center py-5 px-2 gap-1` }>
                      <FaRegPaperPlane size={ 25 } />
                      <span className="text-sm">Contact</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left navigation for Mobile */ }
              <div className="lg:hidden fixed top-[40%] right-0 border border-r-0 z-30 bg-white/80 rounded-xs">
                <div className={ `max-w-[3.5rem] max-h-[10.5rem] text-black shadow-xl rounded-lg` }>
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={ `w-full hover:text-primary transition cursor-pointer` }
                      onClick={ () => setActiveTab( "about" ) }
                    >
                      <div className={ `${activeTab === "about" && "text-primary"} border-b border-black py-3 px-3` }>
                        <FaRegUser size={ 25 } />
                      </div>
                    </div>
                    <div
                      className={ `w-full hover:text-primary transition cursor-pointer` }
                      onClick={ () => setActiveTab( "director" ) }
                    >
                      <div className={ `${activeTab === "director" && "text-primary"} border-b border-black py-3 px-3` }>
                        <RiInfoCardLine size={ 25 } />
                      </div>
                    </div>
                    <div
                      className={ `w-full hover:text-primary transition cursor-pointer` }
                      onClick={ () => setActiveTab( "contact" ) }
                    >
                      <div className={ `${activeTab === "contact" && "text-primary"} py-3 px-3` }>
                        <FaRegPaperPlane size={ 25 } />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:ml-[6rem]">
                {/* Profile header */ }
                <div className="flex flex-col items-center justify-between w-full md:w-[700px] h-fit min-h-[667px] max-h-[700px] -mt-4 relative bg-gradient-to-b from-blue-50 to-white pt-6 rounded-lg shadow-lg">
                  <div className="relative flex justify-center">
                    <div className="w-[200px] h-[200px] my-3 relative overflow-hidden rounded-full border-4 border-white shadow-lg">
                      <Image
                        src={ `${businessDetails.business_image_url ? `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${businessDetails.business_image_url}` : "/images/logo_msme.png"}` }
                        alt={businessDetails.name_of_organization || "Business Profile"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 px-4 capitalize">{businessDetails.name_of_organization}</h1>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <FaUserAlt    size={17} className="text-secondary" />
                      <p className="text-base text-primary  font-medium">{businessDetails.primary_contact_name}</p>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <FaPhone size={17} className="text-secondary" />
                      <p className="text-base text-primary font-medium">{businessDetails.primary_contact_number}</p>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <MdEmail  size={17} className="text-secondary" />
                      <p className="text-base text-primary font-medium">{businessDetails.primary_contact_email}</p>
                    </div>

                    <div className="min-h-[45px]">
                      {/* <div className="flex items-center justify-center space-x-4 mt-6">
                        <a href="#" className="text-gray-600 hover:text-primary transition-colors p-2 bg-white rounded-full shadow-sm">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.753 18.305c-.261-.586-.789-.991-1.871-1.241-2.293-.529-4.428-.993-3.393-2.945 3.145-5.942.833-9.119-2.489-9.119-3.388 0-5.644 3.299-2.489 9.119 1.066 1.964-1.148 2.427-3.393 2.945-1.084.25-1.608.658-1.867 1.246-1.405-1.723-2.251-3.919-2.251-6.31 0-5.514 4.486-10 10-10s10 4.486 10 10c0 2.389-.845 4.583-2.247 6.305z" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-600 hover:text-primary transition-colors p-2 bg-white rounded-full shadow-sm">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-600 hover:text-primary transition-colors p-2 bg-white rounded-full shadow-sm">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-600 hover:text-primary transition-colors p-2 bg-white rounded-full shadow-sm">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0 3c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 14c-2.209 0-4.209-.896-5.657-2.342l8.658-8.658c.499.089.999.156 1.499.269v2.231c0 .874-.43 1.688-1.152 2.198-1.137.808-2.333 1.736-3.348 2.302-1.325.735-1.746.468-2.635-.463-1.552-1.623-3.859-1.438-5.363-.371v-.001z" />
                          </svg>
                        </a>
                      </div> */}
                    </div>
                  <div className="mt-8 flex items-center justify-center">
                    {businessDetails?.business_profile_url ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${businessDetails.business_profile_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm bg-white border border-gray-300 py-3 px-5 rounded-sm hover:bg-gray-50 transition shadow-sm hover:shadow text-primary"
                      >
                        <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Business Details
                      </a>
                    ) : (
                      <span className="flex items-center text-sm bg-gray-100 border border-gray-200 py-3 px-5 rounded-sm text-gray-400 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Business Details
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center">
                    {businessDetails?.incorporation_image_url && userType === "admin" ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${businessDetails.incorporation_image_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm bg-white border border-gray-300 py-3 px-5 rounded-sm hover:bg-gray-50 transition shadow-sm hover:shadow text-primary"
                      >
                        <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Incorporation certificate
                      </a>
                    ) : (
                      <span className="flex items-center text-sm bg-gray-100 border border-gray-200 py-3 px-5 rounded-sm text-gray-400 cursor-not-allowed">
                        <svg className="w-5 h-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Incorporation certificate
                      </span>
                    )}
                  </div>

                  </div>
                  {/* Buttons */}
                  <div className="flex max-w-full mx-auto items-center justify-between mt-10 mb-5 border-t border-primary/10 w-full rounded-b-lg shadow-inner">
                    <div className={`flex-1 text-center px-4 py-4 text-black font-semibold border-r border-primary/10 `}>
                      Business: <span className={`${businessDetails.business_type.toLowerCase() === 'registered' ? "text-secondary" : "text-red-500 text-sm" }`}>{businessDetails.business_type}</span>
                    </div>
                    <div className="flex-1 text-center text-[16px] px-4 py-4 bg-inherit text-black font-semibold">
                      PWD: <span className={`${businessDetails.disability_owned.toLowerCase() === 'yes' ? "text-secondary" : "text-red-500" }`}>{businessDetails.disability_owned === "Yes" ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic sections */ }
                <div className="md:w-full h-fit max-h-[667px] overflow-y-auto overflow-x-hidden mt-10 md:mt-0 bg-white rounded-lg shadow-lg">
                  {activeTab === "about" && (
                    <AboutSection 
                      businessDetails={businessDetails}
                    />
                  )}

                  {activeTab === "director" && (
                    <DirectorSection 
                      directors={directorsList}
                    />
                  )}

                  {activeTab === "contact" && (
                    <ContactSection 
                      businessDetails={businessDetails}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Partners */ }
          <Partners />
        </>
      )}
    </div>
  );
};
export default Page