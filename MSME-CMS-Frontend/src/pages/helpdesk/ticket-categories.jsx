import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTicketCategories, createTicketCategory, updateTicketCategory, deleteTicketCategory } from '../../api/helpdesk';
import Swal from 'sweetalert2';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiClock, FiTag, FiCheck, FiX } from 'react-icons/fi';

const TicketCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    sla_hours: 48,
    is_active: true,
    display_order: 0
  });

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#F97316', // Orange
  ];

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getTicketCategories();
      setCategories(data || []);
    } catch (err) {
      // Error is already logged in API interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      sla_hours: 48,
      is_active: true,
      display_order: categories.length
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      sla_hours: category.sla_hours,
      is_active: category.is_active,
      display_order: category.display_order || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      Swal.fire('Error', 'Category name is required', 'warning');
      return;
    }

    try {
      if (editingCategory) {
        await updateTicketCategory(editingCategory.id, formData);
        Swal.fire('Success', 'Category updated successfully', 'success');
      } else {
        await createTicketCategory(formData);
        Swal.fire('Success', 'Category created successfully', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        await deleteTicketCategory(category.id);
        Swal.fire('Deleted', 'Category has been deleted', 'success');
        fetchCategories();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to delete category', 'error');
      }
    }
  };

  const toggleActive = async (category) => {
    try {
      await updateTicketCategory(category.id, { is_active: !category.is_active });
      fetchCategories();
    } catch (error) {
      Swal.fire('Error', 'Failed to update category status', 'error');
    }
  };

  return (
    <div className="p-6 px-10 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 pb-5">
        Pages / <Link to="/helpdesk" className="hover:text-primary-600">Help Desk</Link> / <span className="text-gray-800">Categories</span>
      </div>

      {/* Header */}
      <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/helpdesk" className="hover:bg-white/20 p-1 rounded">
            <FiArrowLeft size={20} />
          </Link>
          <span>Ticket Categories</span>
          <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded">{categories.length} categories</span>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 px-4 py-2 rounded text-sm"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                !category.is_active ? 'opacity-60' : ''
              }`}
            >
              <div
                className="h-2"
                style={{ backgroundColor: category.color }}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <FiTag style={{ color: category.color }} size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        category.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FiClock size={14} />
                    <span>SLA: {category.sla_hours}h</span>
                  </div>
                  <div className="text-gray-400">
                    {category.ticket_count || 0} tickets
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-gray-400">Order: {category.display_order}</span>
                  <button
                    onClick={() => toggleActive(category)}
                    className={`text-xs px-3 py-1 rounded ${
                      category.is_active
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FiTag className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No categories found. Create your first category!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Technical Support"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                  placeholder="Brief description of this category..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <FiCheck className="text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SLA Hours
                  </label>
                  <input
                    type="number"
                    value={formData.sla_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, sla_hours: parseInt(e.target.value) || 48 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={1}
                  />
                  <p className="text-xs text-gray-400 mt-1">Expected response time</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    min={0}
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower = shows first</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible in contact form)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketCategories;
