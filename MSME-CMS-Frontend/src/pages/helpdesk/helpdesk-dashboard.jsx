import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets, getHelpDeskStats, getTicketCategories, getAdmins, updateTicket, deleteTicket } from '../../api/helpdesk';
import Swal from 'sweetalert2';
import { FiSearch, FiFilter, FiRefreshCw, FiEye, FiTrash2, FiUser, FiClock, FiAlertCircle, FiCheckCircle, FiInbox } from 'react-icons/fi';
import { MdOutlineAssignmentInd, MdPriorityHigh } from 'react-icons/md';

const HelpDeskDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const limit = 10;

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category_id: '',
    assigned_to: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'awaiting_response', label: 'Awaiting Response', color: 'bg-purple-100 text-purple-800' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes, categoriesRes, adminsRes] = await Promise.all([
        getTickets({ ...filters, page, limit }),
        getHelpDeskStats(),
        getTicketCategories(),
        getAdmins()
      ]);

      setTickets(ticketsRes?.values?.rows || []);
      setTotalPages(ticketsRes?.total_pages || 1);
      setTotalData(ticketsRes?.total || 0);
      setStats(statsRes);
      setCategories(categoriesRes || []);
      setAdmins(adminsRes || []);
    } catch (err) {
      // Error is already logged in API interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category_id: '', assigned_to: '', search: '' });
    setPage(1);
  };

  const handleQuickAssign = async (ticketId, adminId) => {
    try {
      await updateTicket(ticketId, { assigned_to: adminId || null });
      Swal.fire('Success', 'Ticket assignment updated', 'success');
      fetchData();
    } catch (error) {
      Swal.fire('Error', 'Failed to update assignment', 'error');
    }
  };

  const handleQuickStatusChange = async (ticketId, status) => {
    try {
      await updateTicket(ticketId, { status });
      Swal.fire('Success', 'Status updated', 'success');
      fetchData();
    } catch (error) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (ticketId) => {
    const result = await Swal.fire({
      title: 'Delete Ticket?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        await deleteTicket(ticketId);
        Swal.fire('Deleted', 'Ticket has been deleted', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete ticket', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(o => o.value === status);
    return option ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : status;
  };

  const getPriorityBadge = (priority) => {
    const option = priorityOptions.find(o => o.value === priority);
    return option ? (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : priority;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 px-10 min-h-screen">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Help Desk</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totals?.total || 0}</p>
              </div>
              <FiInbox className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totals?.open || 0}</p>
              </div>
              <FiAlertCircle className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totals?.in_progress || 0}</p>
              </div>
              <FiClock className="text-3xl text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.totals?.resolved || 0}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.alerts?.urgent || 0}</p>
              </div>
              <MdPriorityHigh className="text-3xl text-red-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">{stats.alerts?.overdue || 0}</p>
              </div>
              <FiClock className="text-3xl text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 py-4 text-white text-start mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span>Help Desk Tickets</span>
          <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded">{totalData} tickets</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm"
          >
            <FiFilter /> Filters
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm"
          >
            <FiRefreshCw /> Refresh
          </button>
          <Link
            to="/ticket-categories"
            className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 px-3 py-1.5 rounded text-sm"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ID, Name, Email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priority</option>
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Agents</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>{admin.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-gray-50 transition-colors ${!ticket.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-primary-600">{ticket.ticket_id}</p>
                        <p className="text-xs text-gray-500">{ticket.name}</p>
                        <p className="text-xs text-gray-400">{ticket.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[200px]" title={ticket.subject}>
                        {ticket.subject}
                      </p>
                      {ticket.response_count > 0 && (
                        <p className="text-xs text-gray-500">{ticket.response_count} responses</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleQuickStatusChange(ticket.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-transparent focus:ring-1 focus:ring-primary-500"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(ticket.priority)}</td>
                    <td className="px-4 py-3">
                      {ticket.category ? (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: ticket.category.color }}
                        >
                          {ticket.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.assigned_to || ''}
                        onChange={(e) => handleQuickAssign(ticket.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-transparent focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Unassigned</option>
                        {admins.map(admin => (
                          <option key={admin.id} value={admin.id}>{admin.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/ticket/${ticket.id}`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center px-4 py-12 text-gray-500">
                    <FiInbox className="mx-auto text-4xl mb-2 text-gray-300" />
                    <p>No tickets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Previous
        </button>
        <span className="text-primary-950 font-medium">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HelpDeskDashboard;
