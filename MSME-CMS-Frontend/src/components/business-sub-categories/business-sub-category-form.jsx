import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getbusinessCategory } from '../../api/business-category';
import CustomInputField from '../CustomInputField';

const BusinessSubCategoryForm = ( { onSubmit, onCancel, defaultData = {}, loading } ) => {
  const [ businessCategoryList, setBusinessCategoryList ] = useState( [] );
  const [ formData, setFormData ] = useState( {
    name: defaultData?.name || '',
    BusinessCategorieId: defaultData?.BusinessCategorieId || null,
    BusinessCategorieName: defaultData?.BusinessCategorieName || '',
  } );

  const handleChange = ( e ) => {
    const { name, value } = e.target;
    if ( name === 'name' && value.length > 50 ) {
      Swal.fire( {
        icon: "warning",
        title: "Too Long",
        text: "Name must not exceed 50 characters.",
      } );
      return;
    }
    if ( name === 'BusinessCategorieId' && !value ) {
      Swal.fire( {
        icon: "warning",
        title: "Invalid Field",
        text: "Please select a Business Category.",
      } );
      return;
    }
    if ( name === 'BusinessCategorieId' ) {
      const selectedCategory = businessCategoryList.find( category => String(category.id) === String(value) );
      setFormData( prev => ( { ...prev, [ name ]: value, BusinessCategorieName: selectedCategory ? selectedCategory.name : '' } ) );
      return;
    }else {
      setFormData( prev => ( { ...prev, [ name ]: value } ) );
    }
  };
  const handleSubmit = ( e ) => {
    e.preventDefault();

    const isEditMode = Boolean( defaultData && defaultData.id );
    const isImageMissing = !formData.name || !formData.BusinessCategorieId;

    if ( !isEditMode && ( isImageMissing ) ) {
      Swal.fire( {
        icon: "warning",
        title: "Invalid Field",
        text: "Please fill both fields.",
      } );
      return;
    }
    console.log( formData )
    onSubmit( formData, defaultData?.id );
  };
  const fetchcategories = async ( page = 1, limit = 10 ) => {
    try {
      const response = await getbusinessCategory( page, limit );
      if ( response?.values?.rows ) {
        setBusinessCategoryList(response?.values?.rows || []);
      }
    } catch ( err ) {
      console.error( "Failed to fetch business sub categories:", err );
    }
  }
  useEffect( () => {
    fetchcategories();
  }, [] );

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <form onSubmit={ handleSubmit } className="grid grid-cols-1 gap-4 mb-6">
        <div className=''>
          <CustomInputField
            width="100%"
            height="40px"
            charLimit={25}
            label="Name"
            asterisk={true}
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Business Sub Category Name"
            note="Max 25 characters."
            className="w-full border rounded"
          />
        </div>
        {/* A dropdown showing the lists of all categories */}
        <div className=''>
          <label className="block mb-1">Business Category <span className='text-red-600'>&#42;</span></label>
          <select
            name="BusinessCategorieId"
            onChange={ handleChange }
            value={ formData.BusinessCategorieId }
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="" >Select Business Category</option>
            { businessCategoryList.map( ( category ) => (
              <option key={ category.id } value={ category.id }>
                { category.name }
              </option>
            ) ) }
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit"
            disabled={ loading }
            className="bg-primary-950 shadow-xl shadow-black/20 text-white px-4 py-2 rounded">Submit</button>
          <button type="button" onClick={ onCancel } className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSubCategoryForm;
