import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Swal from 'sweetalert2';
import CustomInputField from '../CustomInputField';

const DownloadForm = ({ defaultData = {}, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: defaultData?.name || '',
    description: defaultData?.description || '',
    file: null,
    url: defaultData?.url || ''  
  });

  useEffect(() => {
    // Effect for syncing with default data
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    if (type === 'file') {
      const file = files[0];

      if (file && file.type === 'application/pdf') {

        setFormData(prev => ({ ...prev, file, url: '' }));
        setFileName(file.name);
      } else {
        Swal.fire('Invalid File', 'Only PDF files are allowed.', 'warning');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, description,  file, url } = formData;
    const isEditMode = Boolean(defaultData && (defaultData.id || defaultData._id));
    const isFileMissing = !file && !url;
    
    if (name.trim().length < 3 || description.trim().length < 3) {
      return Swal.fire('Warning', 'Name and Description must be at least 3 characters.', 'warning');
    }

    if (name.trim().length > 300 ) {
      return Swal.fire('Warning', 'Name is too long.', 'warning');
    }

  if (!isEditMode && isFileMissing) {
    return Swal.fire('Warning', 'Please upload a PDF attachment.', 'warning');
  }


  onSubmit(formData, defaultData?.id);
};


  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <form onSubmit={handleSubmit} className="  mb-6">
        <div>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={100}
            label="Name"
            asterisk={true}
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            note="Max 100 characters."
            className="w-full border rounded"
          />
        </div>


        <div className="mb-4 my-5 ">
          <CustomInputField
            width="100%"
            height="160px"
            charLimit={300}
            label="Description"
            asterisk={true}
            textarea= {true}
            required
            name="Description"
            value={formData.description}
            onChange={handleChange}
            note="Max 300 characters."
            className="w-full"
          />
        </div>
        

        <div className="flex flex-col mt-16 gap-2">
          <label className="block mb-1">Upload File <span className='text-red-600'>&#42;</span></label>
          <input
            type="file"
            accept="application/pdf"
            name="file"
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {/* <span className="text-gray-600 text-sm">{fileName}</span> */}
          <span className='text-red-600 text-sm'>NOTE: PDF- less than 10 MB</span>
        </div>

        {defaultData?.url && (
              <a
              href={`${import.meta.env.VITE_DOCS_URL}${defaultData.url}`}
              alt={defaultData.name}
              className="h-24 w-24 object-cover rounded-md border border-gray-200 bg-white"
            >Link </a>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-950 shadow-xl shadow-black/20 text-white px-4 py-2 rounded"
          >
            {loading ? 'Submitting...' : defaultData?.id ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DownloadForm;