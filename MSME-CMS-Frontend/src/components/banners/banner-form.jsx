import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Swal from 'sweetalert2';
import CustomInputField from '../CustomInputField';

const BannerForm = ({ defaultData = {}, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: defaultData?.name || '',
    description: defaultData?.description || '',
    link: defaultData?.url || '',
    file: null,
    image_url: defaultData?.image_url || ''  
  });

  function hasLongWords(text, maxLength) {
    if (!text) return false;
    
    const words = text.trim().split(/\s+/);
    return words.length>maxLength
}

  useEffect(() => {
    // Effect for syncing with default data
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, file, image_url: '' }));
      } else {
        Swal.fire('Invalid File', 'Only image files (JPG, PNG, JPEG) are allowed.', 'warning');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, description, file, image_url } = formData;
    const isEditMode = Boolean(defaultData && (defaultData.id || defaultData._id));
    const isFileMissing = !file && !image_url;

    if (name.trim().length < 3 || description.trim().length < 3) {
      return Swal.fire('Warning', 'Name and Description must be at least 3 characters.', 'warning');
    }

    if (hasLongWords(name, 8)|| description.trim().length >= 4000) {
      return Swal.fire('Warning', 'Name or Description is too long.', 'warning');
    }

    if (!isEditMode && isFileMissing) {
      return Swal.fire('Warning', 'Please upload an image.', 'warning');
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
            charLimit={46}
            label="Name"
            asterisk={true}
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter banner name"
            note="Max 46 characters."
            className="w-full border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Link <span className='text-red-600'>&#42;</span></label>
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        
        <div className="mb-4 my-5">
          <CustomInputField
            width="100%"
            height="100px"
            charLimit={70}
            label="Description"
            asterisk={true}
            required
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            note="Max 70 characters."
            textarea={true}
            className="w-full rounded"
          />
        </div>
        

        <div className="flex flex-col mt-12 gap-2">
          <label className="block mb-1">Upload Image <span className='text-red-600'>&#42;</span></label>
          <input
            type="file"
            accept="image/*"
            name="file"
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {/* <span className="text-gray-600 text-sm">{fileName}</span> */}
          <span className='text-red-600 text-sm'>NOTE: JPG, PNG, JPEG , SVG- less than 1 MB</span>
        </div>

        {defaultData?.image_url && (
          <div className="mt-2">
            <img
              src={`${import.meta.env.VITE_DOCS_URL}${defaultData.image_url}`}
              alt={defaultData.name}
              className="h-24 w-24 object-cover rounded-md border border-gray-200 bg-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12px' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
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

export default BannerForm;