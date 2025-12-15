import { useEffect, useState } from "react";
import { getFaqList, removeFaq, updateFaq } from "../../api/faq";
import Swal from "sweetalert2";
import ReactQuill from "react-quill-new";
import CustomInputField from "../CustomInputField";

const FaqTable = () => {
  const [ faqs, setFaqs ] = useState( [] );
  const [ page, setPage ] = useState( 1 );
  const [ limit ] = useState( 10 );
  const [ totalPages, setTotalPages ] = useState( 1 );
  const [ loading, setLoading ] = useState( false );
  const [ editingId, setEditingId ] = useState( '' );
  const [ editFaqValues, setEditFaqValues ] = useState( {
    question: "",
    answer: ""
  } );

  // Fetch Faq whenever page or limit changes
  const fetchFaq = async ( page, limit ) => {
    try {
      setLoading( true );
      const data = await getFaqList( page, limit );
      setFaqs( data?.values?.rows || [] );
      setTotalPages( data?.total_pages || 1 );
    } catch ( err ) {
      console.error( "Error fetching Faq", err );
    } finally {
      setLoading( false );
    }
  };
  useEffect( () => {
    fetchFaq( page, limit );
  }, [ page, limit ] );

  // Pagination handlers
  const handleNextPage = () => {
    if ( page < totalPages ) {
      setPage( ( prev ) => prev + 1 );
    }
  };

  const handlePrevPage = () => {
    if ( page > 1 ) {
      setPage( ( prev ) => prev - 1 );
    }
  };

  const handleEditClick = ( item ) => {
    setEditingId( item.id );
    setEditFaqValues( {
      question: item.question,
      answer: item.answer
    } );
  };

  const handleCancelEdit = () => {
    setEditingId( null );
    setEditFaqValues( {
      question: "",
      answer: ""
    } );
  };

  const handleSaveEdit = async ( id ) => {
     if (editFaqValues.question.trim().length < 3|| editFaqValues.answer.trim()<3) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Field",
        text: "Questions and Answer must be more than 3 characters.",
      });
      return
    }
    if (editFaqValues.question.trim().length >= 700 || editFaqValues.answer.trim()>=2000) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Field",
        text: "Questions and Answer not  be more than 700 and 2000 characters.",
      });
      return
    }
    try {
      const res = await updateFaq( id, editFaqValues );
      if ( res.status === 201 ) {
        Swal.fire( {
          icon: "success",
          title: "FAQ",
          text: "FAQ updated successfully",
        } );
        setFaqs( ( prev ) =>
          prev.map( ( faq ) =>
            faq.id === id ? { ...faq, question: editFaqValues.question, answer: editFaqValues.answer } : faq
          )
        );
      } else {
        Swal.fire( {
          icon: "error",
          title: "FAQ",
          text: res?.data?.error?.msg || "Please try again",
        } );
      }
    } catch ( error ) {
      Swal.fire( {
        icon: "error",
        title: "Error",
        text: error?.response?.data?.error?.msg || error.message || "Something went wrong!",
      } );
    } finally {
      setEditingId( null );
      setEditFaqValues( {
        question: "",
        answer: ""
      } );
    }
  };

  const handleDelete = async ( indexToRemove ) => {
    try {
      const res = await removeFaq( indexToRemove )
      if ( res.status === 201 ) {
        Swal.fire( {
          icon: "success",
          title: "FAQ",
          text: "FAQ remove successfully",
        } )
        fetchFaq( page, limit )
      } else {
        Swal.fire( {
          icon: "error",
          title: "FAQ",
          text: res?.data?.error.msg || "Please try again",
        } );
      }
    } catch ( error ) {
      Swal.fire( {
        icon: "error",
        title: "Error",
        text: error?.response?.data || error.message || "Something went wrong!",
      } );
    }
  };

  const confirmDelete = (id, name) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${name}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id);
      }
    });
  };

  return <div>
    { loading ? (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    ) : (
      <>
        { faqs.map( ( item ) => (
          <div key={ item.id } className='flex mb-4 w-full gap-3 justify-between flex-row'>
            { editingId === item.id ? (
              <>
                <div className="flex flex-col gap-2 h-[18rem] w-full border-2 border-gray-300 rounded-lg p-4">
                  <CustomInputField
                    width="100%"
                    height="40px"
                    charLimit={135}
                    asterisk={false}
                    required
                    placeholder="Enter Question"
                    name="question"
                    value={editFaqValues.question}
                    onChange={ ( e ) => setEditFaqValues( {
                      ...editFaqValues,
                      question: e.target.value,
                    } ) }
                    note="Max 135 characters."
                    className="w-full border rounded"
                  />
                  
                  <div className=' '>
                    <CustomInputField
                      width="100%"
                      height="120px"
                      charLimit={600}
                      asterisk={false}
                      textarea= {true}
                      required
                      placeholder="Enter Answer"
                      name="answer"
                      value={editFaqValues.answer}
                      onChange={ ( value ) => setEditFaqValues( { ...editFaqValues, answer: value } ) }
                      note="Max 600 characters."
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={ () => handleSaveEdit( item.id ) }
                    className='bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-md'
                  >
                    Save
                  </button>
                  <button
                    onClick={ handleCancelEdit }
                    className='bg-gray-300 hover:bg-gray-200 text-black px-4 py-2 rounded-md'
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 w-full border-2 border-gray-300 rounded-lg p-4">
                  <div className='w-11/12 p-3   border'>{ item.question }</div>
                   <div className="w-full  h-[1px] bg-gray-400/20 "></div>
                  <div className='w-11/12 p-3   border' dangerouslySetInnerHTML={ { __html: item.answer } }></div>
                </div>
                <div className='flex flex-col gap-2'>
                  <button
                    onClick={ () => handleEditClick( item ) }
                    className="px-3 py-1.5 bg-white text-primary-950 text-xs rounded-lg hover:bg-primary-950/10 border border-primary-950/20 shadow-sm hover:shadow transition-all flex items-center gap-1"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>

                    Edit
                  </button>
                  <button
                    onClick={ () => confirmDelete( item.id, item.question ) }
                    className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-md hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) }
          </div>
        ) ) }

        {/* Pagination Controls */ }
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={ handlePrevPage }
            disabled={ page === 1 }
            className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
          >
            Previous
          </button>
          <span className="text-primary-950 font-medium"> Page { page } of { totalPages }</span>
          <button
            onClick={ handleNextPage }
            disabled={ page === totalPages }
            className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
          >
            Next
          </button>
        </div>
      </>
    ) }
  </div>;
};
export default FaqTable;