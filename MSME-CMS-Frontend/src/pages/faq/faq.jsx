import React from 'react'
import 'react-quill-new/dist/quill.snow.css';
import FaqTable from '../../components/faq/faq-table';
import FaqForm from '../../components/faq/faq-form';

const Faq = () => {
  const [ isAdding, setIsAdding ] = React.useState( false );
  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">Pages / <span className="text-gray-800">FAQs</span></div>
      <div className="flex items-center justify-between bg-primary-950  shadow-xl shadow-black/15  font-semibold px-5 text-white py-4 text-start mb-6 ">
        <div>FAQs</div>
        <div
        onClick={ () => setIsAdding( !isAdding ) }
        className="bg-white cursor-pointer text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 transition-colors"
          >
            + Add New
        </div>
      </div>
      { isAdding ? <FaqForm closeForm = {() => setIsAdding(false)}/> : <FaqTable />}
    </div>
  )
}

export default Faq;