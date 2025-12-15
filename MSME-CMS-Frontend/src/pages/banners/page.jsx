import React, { useEffect, useState } from 'react';
import BannerForm from '../../components/banners/banner-form';
import Swal from 'sweetalert2';
import BannerTable from '../../components/banners/banner-table';
import { createBannerData, getBannerData, removeBannerData, updateBannerData, uploadBannerImageData } from '../../api/banner';

const Banners = () => {
  const [bannerData, setBannerData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddOrUpdateEntry = async (formData, id) => {
    console.log(formData)
    setLoading(true);
    try {

      let imageUrl = formData.image_url||null;
      console.log(formData.file instanceof File)
      if (formData.file instanceof File) {
        const uploadRes = await uploadBannerImageData(formData.file);
        imageUrl = uploadRes?.data?.url;
      }

      console.log(formData)
      const payload = {
        name: formData.name,
        description: formData.description,
        image_url: imageUrl,
        url:formData.link,
      };

      if (id) {
        await updateBannerData(id, payload);
        Swal.fire('Updated!', 'Banner updated successfully.', 'success');
      } else {
        await createBannerData(payload);
        Swal.fire('Created!', 'Banner created successfully.', 'success');
      }

      await fetchData()
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this Banner!',
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
          await removeBannerData(id);
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Banner has been deleted.',
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
            text: 'Failed to delete Banner.',
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
      const data = await getBannerData(currentPage || page, limit);
      setBannerData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data?.total)
    } catch (err) {
      console.error('Error fetching  Banner', err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch  Banner.',
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
        Pages / <span className="text-gray-800">Banners</span>
      </div>

      <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white flex justify-between items-center mb-6">
        <span>Banners</span>
        {!showForm && !editingItem && (
          <div className="flex items-center gap-5">
            <span className="text-sm text-white/80">{totalData} Entries Found</span>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50"
            >
              + Add New
            </button>
          </div>
        )}
      </div>

      {(showForm || editingItem) && (
        <BannerForm
         onSubmit={handleAddOrUpdateEntry}
          onCancel={() => {
          setShowForm(false);
          setEditItem(null);
          }}
       defaultData={editItem}
        loading={loading}
        />
      )}

      {!showForm && !editingItem && (
        <BannerTable
            data={bannerData}
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
  );
};

export default Banners;
