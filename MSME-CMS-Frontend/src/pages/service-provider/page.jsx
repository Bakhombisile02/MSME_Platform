import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ServiceProviderForm from '../../components/service-provider/service-provider-form';
import ServiceProviderable from '../../components/service-provider/service-provider-table';
import { createServiceProvider, getServiceProvider, removeServiceProvider, updateServiceProvider, uploadServiceProvider } from '../../api/service-provider';
import { exportServiceProviderToExcel } from '../../utils/exports/excel-service-provider-exprt';

const ServiceProvider = () => {
  const [providerData, setProviderData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalData,setTotalData]=useState(0);

  const handleAddOrUpdateEntry = async (formData, id) => {
    const name = formData.name.trim();
    const wordCount = name.split(/\s+/).length;
    if (name.length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Field",
        text: "Name must be more than 3 characters.",
      });
      return;
    }

    if (wordCount > 170 || name.length > 170) {
      Swal.fire({
        icon: "warning",
        title: "Too Long",
        text: "Name must not exceed 50 words",
      });
      return;
    }
    setLoading(true)

    try {
      let imageUrl =formData.icon_url|| null;

      if (formData.image instanceof File) {
        const uploadRes = await uploadServiceProvider(formData.image);
        imageUrl = uploadRes?.data?.url;
      }



      const payload = {
        name: formData.name,
        business_name:formData.business_name,
        business_description:formData.business_description,
        url: imageUrl || (editItem?.url ?? ''),
        email:formData.email,
        mobile:formData.mobile,
        address:formData.address,
        categorie_id:formData.categorie_id,
        categorie_name:formData.categorie_name
      };

      if (id) {
        await updateServiceProvider(id, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Service Provider updated successfully!',
          confirmButtonColor: '#4B5563',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        await createServiceProvider(payload);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Service Provider added successfully!',
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
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Something went wrong while saving Service Provider.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false)
      await fetchData(1);
      setPage(1);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this Service Provider!',
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
          await removeServiceProvider(id);
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Service Provider has been deleted.',
            confirmButtonColor: '#4B5563',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
          await fetchData(1);
          setPage(1);
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to delete Service Provider.',
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
      const data = await getServiceProvider(currentPage || page, limit);
      setProviderData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data?.total)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch Service Provider.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    const response = await getServiceProvider(1, 200);
    if (response?.values?.rows) {
      exportServiceProviderToExcel(response.values.rows);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  return (
    <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Service Provider</span>
      </div>
      <div className="bg-primary-950  shadow-xl shadow-black/15 font-semibold px-5 text-white py-4 text-start mb-6  flex justify-between items-center">
        <span>Service Provider</span>
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
          <button
            onClick={handleExcelExport}
            className="bg-white text-gray-800 px-4 py-1.5 rounded-md text-sm font-medium shadow hover:bg-gray-50 transition-colors"
          >
            Export Excel
          </button>
         </div>
        )}
      </div>
      
      <div className="">
        {showForm ? (
          <ServiceProviderForm
            onSubmit={handleAddOrUpdateEntry}
            onCancel={() => {
              setShowForm(false);
              setEditItem(null);
            }}
            defaultData={editItem}
            loading={loading}
          />
        ) : (
          <ServiceProviderable 
            data={providerData}
            onDelete={handleDelete}
            totalData={totalData}
            onEdit={handleEdit}
            page={page}
            totalPages={totalPages}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            loading={loading}
            showActions = {true}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceProvider;
