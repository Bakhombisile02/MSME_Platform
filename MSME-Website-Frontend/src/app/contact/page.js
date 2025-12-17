"use client";
import Partners from "@/components/Partners";
import Image from "next/image";
import Link from "next/link";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaRegEnvelope, FaUser, FaCommentDots, FaRegFileAlt, FaTag, FaSearch, FaTicketAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import Subscribe from "@/components/Subscribe";
import { createContact, getTicketCategories } from '@/apis/contact-api';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    subject: '',
    message: '',
    category_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [errors, setErrors] = useState({
    email: '',
    mobile: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getTicketCategories();
        if (response.status && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^\d{1,8}$/;
    return mobileRegex.test(mobile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate email
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }
    
    // Validate mobile
    if (name === 'mobile') {
      if (value && !validateMobile(value)) {
        setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 8 digits or less' }));
      } else {
        setErrors(prev => ({ ...prev, mobile: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validateEmail(form.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    if (!validateMobile(form.mobile)) {
      setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 8 digits or less' }));
      return;
    }
    if(form.fullName.length>21){
      toast.error('Full Name length should be smaller than 20 words');
      return;
    }
    if(form.email.length>=30){
      toast.error('Email must be less than 30 words');
      setIsSubmitting(false);
      return
    } 
   if(form.mobile.length>=9){
      toast.error('Mobile Length should be 8 words');
      setIsSubmitting(false);
      return
    }
   if(form.subject.length>=21){
      toast.error('Subject Length should be 20 words');
      setIsSubmitting(false);
      return
    }
    if(form.message.length>400){
      toast.error('Message length should be smaller than 400 words');
      return;
    }
    setLoading(true);
    try {
      const response = await createContact({
        name: form.fullName,
        email: form.email,
        mobile: form.mobile,
        subject: form.subject,
        message: form.message,
        category_id: form.category_id || null,
      });
      if (response.status && response.data?.ticket_id) {
        setTicketSuccess({
          ticketId: response.data.ticket_id,
          email: form.email,
        });
      }
      toast.success('Message sent successfully!');
      setForm({ fullName: '', email: '', mobile: '', subject: '', message: '', category_id: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Enhanced Hero Section */}
      <div className="relative h-[500px]">
        <Image
          src="/images/contact/contact-1.jpg"
          alt="Contact Hero"
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
            className="text-4xl md:text-6xl font-bold font-montserrat mb-4 text-center"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-center max-w-2xl"
          >
            We&apos;d love to hear from you. Let&apos;s discuss how we can help your business grow.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6"
          >
            <Link 
              href="/track-ticket"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-300"
            >
              <FaTicketAlt />
              <span>Track Your Ticket</span>
            </Link>
          </motion.div>
        </div>
        <svg
          className="absolute -bottom-0.5 left-0 w-full rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            className="fill-white"
            d="M0,50
              C125,100 375,0 500,50
              C625,100 875,0 1000,50
              L1000,0
              L0,0
              Z"
          />
        </svg>
      </div>

      {/* Enhanced Contact Cards */}
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaPhone className="text-2xl text-white" />,
              title: "Make a Call",
              content: "+268 7699 9719",
              href: "tel:+26876999719",
              delay: 0.2
            },
            {
              icon: <FaEnvelope className="text-2xl text-white" />,
              title: "Send Email",
              content: "info@msme.co.sz",
              href: "mailto:info@msme.co.sz",
              delay: 0.4
            },
            {
              icon: <FaMapMarkerAlt className="text-2xl text-white" />,
              title: "Visit Office",
              content: "455 West Street Kings Mbabane",
              href: null,
              delay: 0.6
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: item.delay }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary rounded-full p-4 shadow-md">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-montserrat text-primary">{item.title}</h3>
                  {item.href ? (
                    <a href={item.href} className="text-gray-600 hover:text-primary transition">{item.content}</a>
                  ) : (
                    <p className="text-gray-600">{item.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map and Form Section */}
      <div className="max-w-7xl mx-auto mt-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat text-gray-800 mb-4">
            Find Us on Google
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Visit our office or send us a message. We&apos;re here to help you with any questions you might have.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Enhanced Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 group"
          >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
          <iframe
            title="Swaziland Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.853505097831!2d31.133243615203773!3d-26.324249583379137!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ee7c61e098e8dbd%3A0xf2f285dcad81929f!2sMbabane%2C%20Eswatini!5e0!3m2!1sen!2szw!4v1717422123456!5m2!1sen!2szw"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          ></iframe>
          </motion.div>

          {/* Enhanced Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden h-[600px] flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex-1 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                Send us a Message
              </h3>
              <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleSubmit}>
                <div className="flex-1 flex flex-col space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <FaUser className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary relative z-10 bg-transparent autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                      required
                      value={form.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <FaRegEnvelope className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary relative z-10 bg-transparent autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:-webkit-text-fill-color-black`}
                      required
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <FaPhone className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                    <input
                      type="text"
                      name="mobile"
                      placeholder="Mobile Number"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary relative z-10 bg-transparent autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                      required
                      maxLength='8'
                      value={form.mobile}
                      onChange={handleChange}
                    />
                  </div>
                  {categories.length > 0 && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                      <FaTag className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                      <select
                        name="category_id"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary relative z-10 bg-transparent appearance-none cursor-pointer"
                        value={form.category_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Category (Optional)</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <FaRegFileAlt className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-primary relative z-10 bg-transparent autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                      required
                      value={form.subject}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="relative group flex-1">
                    <div className="absolute inset-0 bg-primary/5 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                    <FaCommentDots className="absolute left-3 top-4 text-gray-400 group-hover:text-primary transition-colors z-20" />
                    <textarea
                      name="message"
                      placeholder="Your Message"
                      className="w-full h-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none hover:border-primary relative z-10 bg-transparent autofill:bg-transparent [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:-webkit-text-fill-color-black"
                      required
                      value={form.message}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md hover:shadow-lg relative overflow-hidden group"
                  disabled={loading}
                >
                  <span className="relative z-10">{loading ? 'Sending...' : 'Send Message'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ticket Success Modal */}
      {ticketSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTicketAlt className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ticket Created!</h3>
            <p className="text-gray-600 mb-4">
              Your support ticket has been created successfully.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Your Ticket ID</p>
              <p className="text-xl font-mono font-bold text-primary">{ticketSuccess.ticketId}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              A confirmation email has been sent to <strong>{ticketSuccess.email}</strong>. 
              You can use your ticket ID to track the status of your request.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTicketSuccess(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/track-ticket?id=${ticketSuccess.ticketId}&email=${encodeURIComponent(ticketSuccess.email)}`}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch className="text-sm" />
                Track Ticket
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mt-20">
        <Subscribe />
        <Partners />
      </div>
    </div>
  );
}