import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { getServiceCategory } from '../../api/service-category';
import CustomInputField from '../CustomInputField';

const ServiceProviderForm = ({ onSubmit, onCancel, defaultData = {} ,loading}) => {
  const [formData, setFormData] = useState({
    name: defaultData?.name || '',
    email: defaultData?.email || '',
    mobile: defaultData?.mobile || '',
    address: defaultData?.address || '',
    business_name: defaultData?.business_name || '',
    business_description: defaultData?.business_description || '',
    url: defaultData?.url || '',
    categorie_id: defaultData?.categorie_id || '',
    categorie_name: defaultData?.categorie_name || '',
    image: null,
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getServiceCategory(1, 100);
        setCategories(data?.values?.rows || []);
        
        if (defaultData?.categorie_id && !data.values.rows.some(c => c.id === defaultData.categorie_id)) {
          setCategories(prev => [
            ...prev,
            {
              id: defaultData.categorie_id,
              name: defaultData.categorie_name || 'Unknown Category'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [defaultData]);

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (file && file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, [name]: file }));
      } else {
        Swal.fire('Invalid File', 'Only image files are allowed!', 'warning');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const selectedCategory = categories.find(cat => cat.id.toString() === selectedId);
    
    setFormData(prev => ({
      ...prev,
      categorie_id: selectedId,
      categorie_name: selectedCategory ? selectedCategory.name : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isEditMode = Boolean(defaultData && defaultData.id);
    const isImageMissing = !formData.image && !defaultData?.icon_url;

    // Basic validation
    if (!formData.name || !formData.email || !formData.mobile || !formData.categorie_id) {
      Swal.fire('Warning', 'Please fill all required fields', 'warning');
      return;
    }

    if (!isEditMode && isImageMissing) {
      Swal.fire('Warning', 'Please upload an image', 'warning');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire('Invalid Email', 'Please enter a valid email address', 'warning');
      return;
    }

    // Mobile validation (assuming 8-15 digits)
    const mobileRegex = /^\d{8,15}$/;
    if (!mobileRegex.test(formData.mobile)) {
      Swal.fire('Invalid Mobile', 'Please enter a valid mobile number (8-15 digits)', 'warning');
      return;
    }

   
    onSubmit( formData, defaultData?.id);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        </div>

        <div>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={20}
            label="Name of Primary Contact Person"
            asterisk={true}
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            note="Max 20 characters."
            className="w-full border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Email <span className="text-red-600">*</span></label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Phone <span className="text-red-600">*</span></label>
          <input
            type="tel"
            name="mobile"
            maxLength={8}
            value={formData.mobile}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={40}
            label="Address"
            asterisk={true}
            required
            name="address"
            value={formData.address}
            onChange={handleChange}
            note="Max 40 characters."
            className="w-full border rounded"
          />
        </div>

        {/* Business Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        </div>

        <div className="md:col-span-2">
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={65}
            label="Business Name"
            asterisk={true}
            required
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            note="Max 65 characters."
            className="w-full border rounded"
          />
        </div>

        <div className="md:col-span-2">
          <CustomInputField
            width="100%"
            height="160px"
            charLimit={600}
            label="Business Description"
            asterisk={true}
            textarea= {true}
            required
            name="business_description"
            value={formData.business_description}
            onChange={handleChange}
            note="Max 600 characters."
            className="w-full"
          />
        </div>

 
        {/* Category Selection */}
        <div className="md:col-span-2 mt-16">
          <label className="block mb-1">Category <span className="text-red-600">*</span></label>
          <select
            name="categorie_id"
            value={formData.categorie_id}
            onChange={handleCategoryChange}
            className="w-full border px-3 py-2 rounded"
            required
            disabled={loadingCategories}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {loadingCategories && <p className="text-sm text-gray-500">Loading categories...</p>}
        </div>

        {/* Image Upload */}
        <div className="md:col-span-2 mt-4">
          <label className="block mb-1">Upload Image <span className="text-red-600">*</span></label>
          <input
            type="file"
            accept="image/*"
            name="image"
            onChange={handleChange}
            className="border p-2 w-full"
          />
          <span className="text-red-600 text-sm">NOTE: JPG, PNG, JPEG , SVG- less than 1 MB</span>
        </div>

        {defaultData?.url && (
          <div className="md:col-span-2 mt-2">
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

        {/* Form Actions */}
        <div className="md:col-span-2 flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-950 shadow-xl shadow-black/20 text-white px-4 py-2 rounded"
          >
            {defaultData?.id ? 'Update' : 'Submit'}
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

export default ServiceProviderForm;