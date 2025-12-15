import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import DownloadForm from '../../components/download-new/download-new-form';
import DownloadNewTable from '../../components/download-new/download-new-table';
import { createDownloadNewData, getDownloadNewData, removeDownloadNewData, updateDownloadNewData, uploadDownloadNewData } from '../../api/download-new';

const DownloadNew = () => {
  const [downloadData, setDownloadData] = useState([]);
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
    try {
      setLoading(true);

      let url = formData.url||null;
      console.log(formData.file instanceof File)
      if (formData.file instanceof File) {
        const uploadRes = await uploadDownloadNewData(formData.file);
        url = uploadRes?.data?.url;
      }

      console.log(formData)
      const payload = {
        name: formData.name,
        description: formData.description,
        url:url,
      };

      if (id) {
        await updateDownloadNewData(id, payload);
        Swal.fire('Updated!', 'Download data updated successfully.', 'success');
      } else {
        await createDownloadNewData(payload);
        Swal.fire('Created!', 'Download data created successfully.', 'success');
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
      text: 'You will not be able to recover this Download data!',
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
          await removeDownloadNewData(id);
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Download data has been deleted.',
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
            text: 'Failed to delete Download data.',
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
      const data = await getDownloadNewData(currentPage || page, limit);
      setDownloadData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data?.total)
    } catch (err) {
      console.error('Error fetching Download data', err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch Download data.',
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
        Pages / <span className="text-gray-800">Updates and Downloads</span>
      </div>

      <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white flex justify-between items-center mb-6">
        <span>Updates and Downloads</span>
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
        <DownloadForm
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
        <DownloadNewTable
            data={downloadData}
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

export default DownloadNew;
