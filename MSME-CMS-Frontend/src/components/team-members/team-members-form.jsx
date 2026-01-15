import React, { useState } from 'react';
import Swal from 'sweetalert2';
import CustomInputField from '../CustomInputField';

const TeamMemberForm = ({ onSubmit, onCancel, defaultData = {} ,loading}) => {
  const [formData, setFormData] = useState({
    name: defaultData?.name || '',
    icon_url: defaultData?.icon_url || '',    
    position: defaultData?.possition || '',    
    image: null,  
  });

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, [name]: file }));
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File',
          text: 'Only image files are allowed!'
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const isEditMode = Boolean(defaultData && defaultData.id);
    const isImageMissing = !formData.image && !defaultData?.icon_url;

    if (!isEditMode && (isImageMissing  )) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Field",
        text: "Please unload an image.",
      });
      return;
    }

    onSubmit(formData, defaultData?.id);
  };


  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-6">
        <div className=''>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={20}
            label="Name"
            asterisk={true}
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            note="Max 20 characters."
            className="w-full border rounded"
          />
        </div>
         <div className=''>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={20}
            label="Position"
            asterisk={true}
            required
            name="position"
            value={formData.position}
            onChange={handleChange}
            note="Max 20 characters."
            className="w-full border rounded"
          />
        </div>
        <div className='flex flex-col gap-2'>
          <label className="block mb-1">Upload Icon Image  <span className='text-red-600'>&#42;</span></label>
          <input
            type="file"
            accept="image/*"
            name='image'
            onChange={handleChange}
            className="border p-2 w-full"
          />
             </div>
        {defaultData?.url && (
            <div className="mt-2">
              <img 
                src={`${import.meta.env.VITE_DOCS_URL}${defaultData.url}`} 
                alt={defaultData.name} 
                className="h-24 w-24 object-cover rounded-md border border-gray-200 bg-white" 
                onError={(e) => {
                  e.target.onError = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12px' fill='%23666666'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          )}
 
          <span  className='text-red-600  text-sm ' >NOTE: JPG, PNG, JPEG , SVG- less than 1 MB</span>
       
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-primary-950 shadow-xl shadow-black/20 text-white px-4 py-2 rounded" >{loading ? 'Submitting...' : defaultData?.id ? 'Update' : 'Submit'}
</button>
          <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default TeamMemberForm;
