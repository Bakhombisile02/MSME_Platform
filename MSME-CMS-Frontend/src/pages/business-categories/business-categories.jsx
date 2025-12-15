import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import BusinessCategoryForm from '../../components/business-category/business-category-form';
import BusinessCategoryTable from '../../components/business-category/business-category-table';
import { createbusinessCategory, getbusinessCategory, removebusinessCategory, updatebusinessCategory, uploadbusinessCategory } from '../../api/business-category';

const BusinessCategory = () => {
  const [businessCategoryData, setBusinessCategoryData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalData,setTotalData]=useState(0);

  const handleAddOrUpdateEntry = async (formData, id) => {
    setLoading(true);
    const name = formData.name.trim();
    const wordCount = name.split(/\s+/).length;

    if (name.length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Field",
        text: "Name must be more than 3 characters.",
      });
      setLoading(false);
      return;
    }

    if (wordCount > 170 || name.length > 170) {
      Swal.fire({
        icon: "warning",
        title: "Too Long",
        text: "Name must not exceed 50 words",
      });
      setLoading(false);
      return;
    }

    try {
      let imageUrl =formData.icon_url|| null;

      if (formData.image instanceof File) {
        const uploadRes = await uploadbusinessCategory(formData.image);
        imageUrl = uploadRes?.data?.url;
      }



      const payload = {
        name: formData.name,
        url: imageUrl || (editItem?.url ?? ''),
      };

      if (id) {
        console.log("upload",payload)
        await updatebusinessCategory(id, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Business Category updated successfully!',
          confirmButtonColor: '#4B5563',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        console.log("create",payload)
        await createbusinessCategory(payload);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Business Category added successfully!',
          confirmButtonColor: '#4B5563',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      }
  
      await fetchData();
      setShowForm(false);
      setEditItem(null);
    } catch (error) {
      console.error('Failed to create/update Business Category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: `${error.response.data.error ? error.response.data.error : "Something went wrong while saving Business Category."} `,
        confirmButtonColor: '#EF4444'
      });
    } finally {
      await fetchData(1);
      setLoading(false);
      setPage(1);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'STOP! Deleting this business category will break the link between this business category and all its sub-categories as well as all MSME businesses listed under this category.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await removebusinessCategory(id);
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Business Category has been deleted.',
            confirmButtonColor: '#4B5563',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
          await fetchData(1);
          setPage(1);
        } catch (err) {
          console.error('Delete failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to delete Business Category.',
            confirmButtonColor: '#EF4444'
          });
        }
      }
    });
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handlePrevPage = (currentPage) => {
    if (currentPage > 1) {
      setPage((prev) => prev - 1);
    }
  };
  
  const handleNextPage = (currentPage) => {
    if (currentPage < totalPages) {
      setPage((prev) => prev + 1);
    }
  };
  
  const fetchData = async (currentPage) => {
    try {
      setLoading(true);
      const data = await getbusinessCategory(currentPage || page, limit);
      setBusinessCategoryData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data?.total)
    } catch (err) {
      console.error('Error fetching business Categories', err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch business Categories.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Business Categories</span>
      </div>
      <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 text-white py-4 text-start mb-6  flex justify-between items-center">
        <span>Business Categories</span>
        {!showForm && (
          <div className='flex flex-row gap-5 items-center text-center'>
          <div className="text-sm text-center text-white/80">
            <span>{totalData} Entries Found</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 transition-colors"
          >
            + Add New
          </button>
         </div>
        )}
      </div>
      
      <div className="">
        {showForm ? (
          <BusinessCategoryForm
            onSubmit={handleAddOrUpdateEntry}
            onCancel={() => {
              setShowForm(false);
              setEditItem(null);
            }}
            defaultData={editItem}
            loading={loading}
          />
        ) : (
          <BusinessCategoryTable  
            data={businessCategoryData}
            onDelete={handleDelete}
            totalData={totalData}
            onEdit={handleEdit}
            page={page}
            totalPages={totalPages}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessCategory;
