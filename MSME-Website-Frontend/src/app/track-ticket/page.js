"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTicketAlt, FaSearch, FaEnvelope, FaClock, FaUser, FaReply, FaStar, FaCheckCircle, FaSpinner, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { trackTicket, submitCustomerReply, submitSatisfactionRating } from '@/apis/contact-api';
import Partners from '@/components/Partners';
import Subscribe from '@/components/Subscribe';

function TrackTicketContent() {
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get('id');
    const emailParam = searchParams.get('email');
    if (idParam) setTicketId(idParam);
    if (emailParam) setEmail(emailParam);
    
    // Auto-track if both params are present
    if (idParam && emailParam) {
      handleTrack(idParam, emailParam);
    }
  }, [searchParams]);

  const handleTrack = async (id = ticketId, emailAddress = email) => {
    if (!id.trim() || !emailAddress.trim()) {
      toast.error('Please enter both Ticket ID and Email');
      return;
    }

    setLoading(true);
    try {
      const response = await trackTicket(id.trim(), emailAddress.trim());
      if (response.status && response.data) {
        setTicket(response.data);
      } else {
        toast.error(response.message || 'Ticket not found');
        setTicket(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to find ticket');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await submitCustomerReply(ticketId, email, replyMessage.trim());
      if (response.status) {
        toast.success('Reply sent successfully!');
        setReplyMessage('');
        // Refresh ticket data
        handleTrack();
      } else {
        toast.error(response.message || 'Failed to send reply');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await submitSatisfactionRating(ticketId, email, rating, ratingFeedback.trim());
      if (response.status) {
        toast.success('Thank you for your feedback!');
        setShowRatingModal(false);
        // Refresh ticket data
        handleTrack();
      } else {
        toast.error(response.message || 'Failed to submit rating');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_customer': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'awaiting_customer': return 'Awaiting Your Response';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[350px]">
        <Image
          src="/images/contact/contact-1.jpg"
          alt="Track Ticket"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold font-montserrat mb-4 text-center"
          >
            Track Your Ticket
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-center max-w-2xl"
          >
            Enter your ticket ID and email to view your support request status
          </motion.p>
        </div>
        <svg
          className="absolute -bottom-0.5 left-0 w-full rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            className="fill-white"
            d="M0,50 C125,100 375,0 500,50 C625,100 875,0 1000,50 L1000,0 L0,0 Z"
          />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FaSearch className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Find Your Ticket</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FaTicketAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ticket ID (e.g., TKT-20251217-XXXX)"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch />
                  Track Ticket
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Ticket Details */}
        <AnimatePresence mode="wait">
          {ticket && (
            <motion.div
              key="ticket-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Ticket Header */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-white/80 text-sm mb-1">Ticket ID</p>
                      <h3 className="text-2xl font-bold font-mono">{ticket.ticket_id}</h3>
                    </div>
                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Subject</p>
                      <p className="font-semibold text-gray-800">{ticket.subject}</p>
                    </div>
                    {ticket.category && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Category</p>
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                        >
                          {ticket.category.name}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Created</p>
                      <p className="text-gray-700">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                      <p className="text-gray-700">{formatDate(ticket.last_activity_at || ticket.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-sm text-gray-500 mb-2">Original Message</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                      {ticket.message}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Thread */}
              {ticket.responses && ticket.responses.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FaReply className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-800">Conversation</h3>
                  </div>

                  <div className="space-y-4">
                    {ticket.responses.map((response, index) => (
                      <motion.div
                        key={response.id || index}
                        initial={{ opacity: 0, x: response.responder_type === 'customer' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${response.responder_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            response.responder_type === 'customer'
                              ? 'bg-primary text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <FaUser className="text-sm opacity-70" />
                            <span className="text-sm font-semibold opacity-90">
                              {response.responder_type === 'customer' ? 'You' : response.admin?.name || 'Support Team'}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{response.message}</p>
                          <p className={`text-xs mt-2 ${response.responder_type === 'customer' ? 'text-white/70' : 'text-gray-500'}`}>
                            {formatDate(response.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form - Show only if ticket is not closed */}
              {ticket.status !== 'closed' && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaPaperPlane className="text-primary" />
                    <h3 className="text-lg font-bold text-gray-800">Send a Reply</h3>
                  </div>

                  <form onSubmit={handleSubmitReply}>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full border border-gray-300 rounded-lg p-4 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {submittingReply ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane />
                            Send Reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Rating Prompt - Show for resolved tickets without rating */}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && !ticket.satisfaction_rating && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-green-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">How was your experience?</h3>
                      <p className="text-gray-600 text-sm">We&apos;d love to hear your feedback on our support.</p>
                    </div>
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FaStar />
                      Rate Support
                    </button>
                  </div>
                </div>
              )}

              {/* Already Rated */}
              {ticket.satisfaction_rating && (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <p className="text-gray-600 mb-2">Your Rating</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`text-2xl ${star <= ticket.satisfaction_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  {ticket.satisfaction_feedback && (
                    <p className="text-gray-500 text-sm italic">&quot;{ticket.satisfaction_feedback}&quot;</p>
                  )}
                </div>
              )}

              {/* Back Link */}
              <div className="text-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <FaArrowLeft />
                  Back to Contact
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Rate Your Experience</h3>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    <FaStar
                      className={`text-4xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-center text-gray-600 mb-6">
                {rating === 0 && 'Click to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </div>

              <textarea
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Additional feedback (optional)"
                className="w-full border border-gray-300 rounded-lg p-4 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || rating === 0}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Rating'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-20">
        <Subscribe />
        <Partners />
      </div>
    </div>
  );
}

export default function TrackTicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-primary" />
      </div>
    }>
      <TrackTicketContent />
    </Suspense>
  );
}
