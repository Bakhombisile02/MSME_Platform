import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getMsmeBusinessDetailData, updateMsmeBusinessStatueData } from '../../api/msme-business';
import { FaFilePdf } from "react-icons/fa";
const placeholderImage = "/assets/logo_msme.png";

const MsmeDetailPage = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const showActionButtons = searchParams.get('actionButtons') === 'true';
  const navigate = useNavigate();
  const [ loading, setLoading ] = useState( true );
  const [ data, setData ] = useState( null );
  const [ error, setError ] = useState( null );
  const [ updatingStatus, setUpdatingStatus ] = useState( false );
  const [ showRejectionModal, setShowRejectionModal ] = useState( false );
  const [ rejectionReason, setRejectionReason ] = useState( '' );

  // console.log("Action buttons:- ",typeof(showActionButtons), showActionButtons)
  const fetchMsmeDetails = async () => {
    // console.log("first")
    try {
      setLoading( true );
      const response = await getMsmeBusinessDetailData( id )
      console.log( response )
      setData( response );
    } catch ( err ) {
      Swal.fire( {
        icon: "warning",
        title: "Alert",
        text: "'Failed to fetch MSME details'",
      } );
      setError( err.response?.data?.message || 'Failed to fetch MSME details' );
    } finally {
      setLoading( false );
    }
  };
  useEffect( () => {
    fetchMsmeDetails();
  }, [ id ] );

  const handleStatusUpdate = async ( email, newStatus, reason ) => {
    if ( newStatus === 3 ) {
      const trimmedReason = reason.trim();

      // Check if reason is empty
      if ( !trimmedReason ) {
        Swal.fire( {
          icon: 'warning',
          title: "Reason Required",
          text: "Please provide a reason for rejection",
          confirmButtonColor: '#EF4444'
        } );
        return;
      }

      // Check character length
      if ( trimmedReason.length > 750 ) {
        Swal.fire( {
          icon: 'warning',
          title: "Reason Too Long",
          text: "Reason must be 750 characters or less",
          confirmButtonColor: '#EF4444'
        } );
        return;
      }
    }

    try {
      setUpdatingStatus( true );
      console.log( `Updating verification status to: ${email, newStatus}` );
      const response = await updateMsmeBusinessStatueData( email, newStatus, id, reason )
      console.log( response )
      // Update local state
      setData( prev => ( {
        ...prev,
        msmeDetails: {
          ...prev.msmeDetails,
          is_verified: newStatus
        }
      } ) );

      Swal.fire( {
        icon: "success",
        title: "Complete",
        text: `Business ${newStatus === 2 ? 'approved' : newStatus === 3 ? 'rejected' : 'set to pending'} successfully`,
      } );

    } catch ( err ) {
      Swal.fire( {
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || 'Failed to update status',
      } );
    } finally {
      setUpdatingStatus( false );
      setShowRejectionModal( false );
      fetchMsmeDetails();
    }
  };

  const getVerificationStatus = ( isVerified ) => {
    const data = Number( isVerified )
    return (
      <span className={ `px-2 py-1 rounded-full text-xs font-medium ${data === 2 ? 'bg-green-100 text-green-800' :
        data === 3 ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'}` }>
        { data === 2 ? 'Approved' :
          data === 3 ? 'Rejected' :
            'Pending' }
      </span>
    );
  };

  if ( loading ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-accent-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-medium">Loading MSME details...</p>
        </div>
      </div>
    );
  }

  if ( error ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Error loading details</h3>
          <p className="text-gray-600 mb-4">{ error }</p>
          <button
            onClick={ () => navigate( -1 ) }
            className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors"
          >
            Go Back
          </button>
        </div>

      </div>
    );
  }

  if ( !data ) {
    return null;
  }

  const { msmeDetails, directorsDetail } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={ () => navigate( -1 ) }
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to list
        </button>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header Section */ }
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{ msmeDetails.name_of_organization }</h1>
              <div className="flex items-center mt-2">
                <span className="text-gray-600 mr-4">{ msmeDetails.town }, { msmeDetails.region }</span>
                { getVerificationStatus( msmeDetails.is_verified ) }
              </div>
            </div>
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={ `${import.meta.env.VITE_DOCS_URL}${msmeDetails.business_image_url}` || placeholderImage }
                alt={ msmeDetails.name_of_organization }
                className="w-full h-full object-cover"
                onError={ ( e ) => {
                  e.target.onError = null;
                  e.target.src = placeholderImage;
                } }
              />
            </div>
          </div>

          {/* Main Content */ }
          <div className="px-6 py-4">
            {/* Business Details Section */ }
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Category</p>
                    <p className="text-gray-800">{ msmeDetails.business_category_name }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Sub-Category</p>
                    <p className="text-gray-800">{ msmeDetails.business_sub_category_name }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Type</p>
                    <p className="text-gray-800">{ msmeDetails.business_type }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Disability Owned</p>
                    <p className="text-gray-800">{ msmeDetails.disability_owned }</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Established Year</p>
                    <p className="text-gray-800">{ msmeDetails.establishment_year }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Number of Employees</p>
                    <p className="text-gray-800">{ msmeDetails.employees }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Annual Turnover</p>
                    <p className="text-gray-800 capitalize">{ msmeDetails.turnover }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Owner Type</p>
                    <p className="text-gray-800">{ msmeDetails.ownerType }</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */ }
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Business Description</h2>
              <p className="text-gray-700">{ msmeDetails.brief_company_description }</p>
            </div>

            {/* Products & Services Section */ }
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Products & Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Products Offered</h3>
                  <p className="text-gray-600">{ msmeDetails.product_offered || 'Not specified' }</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Services Offered</h3>
                  <p className="text-gray-600">{ msmeDetails.service_offered || 'Not specified' }</p>
                </div>
              </div>
            </div>

            {/* Contact Information Section */ }
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-gray-800">{ msmeDetails.email_address }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-gray-800">{ msmeDetails.contact_number }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Profile URL</p>
                    <div className=' flex items-center justify-center w-full'>
                      <a
                        href={ `${import.meta.env.VITE_DOCS_URL}${msmeDetails.business_profile_url}` }
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-500 pl-5 my-2 w-full h-full hover:underline"
                      >
                        <FaFilePdf size={ 42 } />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Physical Address</p>
                    <p className="text-gray-800">{ msmeDetails.street_address }, { msmeDetails.town }, { msmeDetails.region }</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Primary Contact</p>
                    <p className="text-gray-800">{ msmeDetails.primary_contact_name } ({ msmeDetails.primary_contact_email })</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Primary Contact Number</p>
                    <p className="text-gray-800">{ msmeDetails.primary_contact_number }</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Directors Section */ }
            { directorsDetail && directorsDetail.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Directors</h2>
                <div className="flex flex-col gap-2">
                  { directorsDetail.map( ( director ) => (
                    <div key={ director.id } className="bg-gray-50 p-4 rounded-lg w-full">
                      <div className="flex flex-row items-center justify-between gap-2 mt-2 text-sm w-full">
                        <div className=' flex items-center justify-center gap-1'>
                          <p className="text-gray-500">Name:</p>
                          <p className="text-gray-700">{ director.name }</p>
                        </div>
                        <div className=' flex items-center justify-center gap-1'>
                          <p className="text-gray-500">Age:</p>
                          <p className="text-gray-700">{ director.age }</p>
                        </div>
                        <div className=' flex items-center justify-center gap-1'>
                          <p className="text-gray-500">Gender:</p>
                          <p className="text-gray-700">{ director.gender }</p>
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-1">
                          <p className="text-gray-500">Qualification:</p>
                          <p className="text-gray-700">{ director.qualification }</p>
                        </div>
                      </div>
                    </div>
                  ) ) }
                </div>
              </div>
            ) }
            { msmeDetails.is_verified_comments && msmeDetails.is_verified == 3 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Rejection message</h2>
                <p className="text-gray-700">{ msmeDetails.is_verified_comments || 'No rejection message provided' }</p>
              </div>
            ) }
          </div>

          {/* Action Buttons */ }
          { showActionButtons && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={ () => setShowRejectionModal( true ) }
                // onClick={() => handleStatusUpdate(msmeDetails.email_address,3)} 
                disabled={ Number( updatingStatus ) || Number( msmeDetails.is_verified ) === 3 }
                className={ `px-4 py-2 rounded-md border ${Number( updatingStatus ) || Number( msmeDetails.is_verified ) === 3 ?
                  'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' :
                  'bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400'
                  }` }
              >
                Reject
              </button>
              <button
                onClick={ () => handleStatusUpdate( msmeDetails.email_address, 2 ) }
                disabled={ Number( updatingStatus ) || Number( msmeDetails.is_verified ) === 2 }
                className={ `px-4 py-2 rounded-md border ${Number( updatingStatus ) || Number( msmeDetails.is_verified ) === 2 ?
                  'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' :
                  'bg-white text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400'
                  }` }
              >
                Approve
              </button>
            </div>
          )}
        </div>

        { showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reason for Rejection</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md mb-4"
                rows={ 5 }
                placeholder="Enter rejection reason (max 750 characters)"
                value={ rejectionReason }
                onChange={ ( e ) => setRejectionReason( e.target.value ) }
                maxLength={ 750 }
              />
              <div className="text-sm text-gray-500 mb-4">
                { rejectionReason.length }/750 characters
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                  onClick={ () => {
                    setShowRejectionModal( false );
                    setRejectionReason( '' );
                  } }
                  disabled={ updatingStatus }
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={ () => handleStatusUpdate( msmeDetails.email_address, 3, rejectionReason ) }
                  disabled={ updatingStatus || !rejectionReason.trim() }
                >
                  { updatingStatus ? 'Submitting...' : 'Submit Rejection' }
                </button>
              </div>
            </div>
          </div>
        ) }

      </div>
    </div>
  );
};

export default MsmeDetailPage;