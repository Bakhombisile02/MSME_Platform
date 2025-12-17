import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTicketDetail, updateTicket, addTicketResponse, getTicketCategories, getAdmins } from '../../api/helpdesk';
import Swal from 'sweetalert2';
import { FiArrowLeft, FiSend, FiUser, FiClock, FiTag, FiMessageSquare, FiLock, FiMail, FiPhone } from 'react-icons/fi';
import { MdPriorityHigh } from 'react-icons/md';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  // Response form
  const [responseMessage, setResponseMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);

  const statusOptions = [
    { value: 'open', label: 'Open', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'awaiting_response', label: 'Awaiting Response', color: 'bg-purple-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const [ticketRes, categoriesRes, adminsRes] = await Promise.all([
        getTicketDetail(id),
        getTicketCategories(),
        getAdmins()
      ]);
      setTicket(ticketRes);
      setCategories(categoriesRes || []);
      setAdmins(adminsRes || []);
    } catch (err) {
      console.error("Error fetching ticket", err);
      Swal.fire('Error', 'Failed to load ticket details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleUpdate = async (field, value) => {
    try {
      await updateTicket(id, { [field]: value });
      fetchTicket();
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: `${field.replace('_', ' ')} updated successfully`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update ticket', 'error');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim()) {
      Swal.fire('Error', 'Please enter a response message', 'warning');
      return;
    }

    setSendingResponse(true);
    try {
      await addTicketResponse(id, {
        message: responseMessage,
        is_internal_note: isInternalNote
      });
      setResponseMessage('');
      setIsInternalNote(false);
      fetchTicket();
      Swal.fire({
        icon: 'success',
        title: isInternalNote ? 'Internal note added' : 'Response sent',
        text: isInternalNote ? 'Note has been added to the ticket' : 'Customer has been notified via email',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to send response', 'error');
    } finally {
      setSendingResponse(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(o => o.value === status);
    return option?.color || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Ticket not found</p>
        <Link to="/helpdesk" className="text-primary-600 hover:underline">Back to Help Desk</Link>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/helpdesk')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{ticket.ticket_id}</h1>
            <p className="text-sm text-gray-500">Created {formatDate(ticket.createdAt)}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(ticket.status)}`}>
          {statusOptions.find(o => o.value === ticket.status)?.label || ticket.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-primary-950 text-white px-6 py-4">
              <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            </div>
            <div className="p-6">
              {/* Customer Info */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-600 text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{ticket.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiMail size={14} /> {ticket.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiPhone size={14} /> {ticket.mobile}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">Original Message:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiMessageSquare /> Conversation ({ticket.responses?.length || 0})
              </h3>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {ticket.responses && ticket.responses.length > 0 ? (
                ticket.responses.map((response, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      response.is_internal_note
                        ? 'bg-yellow-50 border-l-4 border-yellow-400'
                        : response.responder_type === 'customer'
                        ? 'bg-gray-50'
                        : 'bg-blue-50 border-l-4 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {response.is_internal_note && (
                          <FiLock className="text-yellow-600" title="Internal Note" />
                        )}
                        <span className="font-medium text-gray-800">
                          {response.responder_type === 'customer'
                            ? ticket.name
                            : response.responder_type === 'system'
                            ? 'System'
                            : response.responder?.name || 'Support Agent'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          response.responder_type === 'customer'
                            ? 'bg-gray-200 text-gray-600'
                            : response.responder_type === 'system'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-200 text-blue-600'
                        }`}>
                          {response.responder_type === 'customer' ? 'Customer' : 
                           response.responder_type === 'system' ? 'System' : 'Agent'}
                        </span>
                        {response.is_internal_note && (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-200 text-yellow-700">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(response.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                    {response.email_sent && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <FiMail size={12} /> Email sent {formatDate(response.email_sent_at)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">No responses yet</p>
              )}
            </div>

            {/* Response Form */}
            <div className="border-t p-6">
              <form onSubmit={handleSendResponse}>
                <div className="mb-4">
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder={isInternalNote ? "Add an internal note (not visible to customer)..." : "Type your response to the customer..."}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none ${
                      isInternalNote ? 'bg-yellow-50 border-yellow-300' : ''
                    }`}
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-yellow-500 focus:ring-yellow-500"
                    />
                    <FiLock className={isInternalNote ? 'text-yellow-600' : 'text-gray-400'} />
                    <span className={`text-sm ${isInternalNote ? 'text-yellow-700 font-medium' : 'text-gray-600'}`}>
                      Internal note (private)
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={sendingResponse || !responseMessage.trim()}
                    className="flex items-center gap-2 bg-primary-950 hover:bg-primary-800 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {sendingResponse ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <FiSend />
                    )}
                    {isInternalNote ? 'Add Note' : 'Send Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Properties */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Ticket Properties</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={ticket.category_id || ''}
                  onChange={(e) => handleUpdate('category_id', e.target.value || null)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Assigned To</label>
                <select
                  value={ticket.assigned_to || ''}
                  onChange={(e) => handleUpdate('assigned_to', e.target.value || null)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Unassigned</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">Details</h3>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-800">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Activity:</span>
                <span className="text-gray-800">{formatDate(ticket.last_activity_at)}</span>
              </div>
              {ticket.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className={`font-medium ${new Date(ticket.due_date) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(ticket.due_date)}
                  </span>
                </div>
              )}
              {ticket.first_response_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">First Response:</span>
                  <span className="text-gray-800">{formatDate(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved:</span>
                  <span className="text-green-600">{formatDate(ticket.resolved_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Responses:</span>
                <span className="text-gray-800">{ticket.response_count}</span>
              </div>
              {ticket.satisfaction_rating && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Rating:</span>
                  <span className="text-yellow-500">
                    {'★'.repeat(ticket.satisfaction_rating)}{'☆'.repeat(5 - ticket.satisfaction_rating)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category Info */}
          {ticket.category && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="px-6 py-4 text-white"
                style={{ backgroundColor: ticket.category.color }}
              >
                <h3 className="font-semibold">{ticket.category.name}</h3>
              </div>
              <div className="p-6 text-sm">
                {ticket.category.description && (
                  <p className="text-gray-600 mb-2">{ticket.category.description}</p>
                )}
                {ticket.category.sla_hours && (
                  <p className="flex items-center gap-2 text-gray-500">
                    <FiClock />
                    SLA: {ticket.category.sla_hours} hours
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
