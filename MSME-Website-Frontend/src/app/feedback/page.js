'use client';
import { FaRegEnvelope, FaUser, FaCommentDots, FaStar, FaThumbsUp, FaLightbulb } from 'react-icons/fa';
import Image from "next/image";
import Partners from '@/components/Partners';
import { createFeedback } from '@/apis/feedback-api';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Subscribe from '@/components/Subscribe';

const Page = () => {
  const [formData, setFormData] = useState({
    feedbackType: 'Complaint',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    mobile: ''
  });

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
    setFormData(prev => ({
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
    if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    if (!validateMobile(formData.mobile)) {
      setErrors(prev => ({ ...prev, mobile: 'Mobile number must be 8 digits or less' }));
      return;
    }

    setIsSubmitting(true);
    if(formData.firstName.length>=20||formData.lastName>=20){
      toast.error('First name and Last Name smust be less than 20 words');
      setIsSubmitting(false);
      return
    }
    if(formData.email.length>=30){
      toast.error('Email must be less than 30 words');
      setIsSubmitting(false);
      return
    }

    if(formData.message.length>=400){
      toast.error('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
      return
    }
    console.log(formData.message.length)
    try {
      const payload = {
        feedbackType: formData.feedbackType,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        mobile: formData.mobile,
        message: formData.message
      };

      await createFeedback(payload);
      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setFormData({
        feedbackType: 'Complaint',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        message: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      {/* Hero Section with Parallax Effect */}
      <div className="h-[70vh] w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/90 z-10" />
        <Image
          src="/images/feedback/front.jpg"
          alt="Feedback Hero"
          fill
          className="object-cover object-center scale-110"
          priority
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
              Your Voice Matters
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Help us shape the future of our services by sharing your valuable feedback
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent z-20" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 mb-16 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Section - Info Cards */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FaStar className="text-blue-600 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Why Share Feedback?</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Your insights help us improve and create better experiences for everyone.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FaThumbsUp className="text-green-500 mt-1" />
                  <p className="text-gray-600">Direct impact on our service quality</p>
                </div>
                <div className="flex items-start gap-3">
                  <FaLightbulb className="text-yellow-500 mt-1" />
                  <p className="text-gray-600">Help us innovate and grow</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-[#fdd61d] rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Our Promise</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <p>Fast response time</p>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <p>Confidential feedback handling</p>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <p>Regular updates on improvements</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Section - Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6" autoComplete="off">
              <div className="">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="feedbackType">
                    Feedback Type <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="feedbackType" 
                    name="feedbackType" 
                    value={formData.feedbackType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50"
                  >
                    <option>Complaint</option>
                    <option>Suggestion</option>
                    <option>Enquiry</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-4 text-gray-400" />
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName" 
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter First Name" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary transition-all bg-gray-50" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-4 text-gray-400" />
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName" 
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter Last Name" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaRegEnvelope className="absolute left-4 top-4 text-gray-400" />
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Email Address" 
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50`}
                    required 
                  />
                </div>
                <div className='flex flex-col'>
                  {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                  <span className="text-xs text-gray-500 mt-1">We&apos;ll never share your email with anyone else.</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="mobile">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-4 text-gray-400" />
                  <input 
                    type="tel" 
                    id="mobile" 
                    name="mobile" 
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter Mobile Number" 
                    maxLength="8"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50`}
                    required 
                  />
                </div>
                {errors.mobile && <span className="text-xs text-red-500 mt-1">{errors.mobile}</span>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="message">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCommentDots className="absolute left-4 top-4 text-gray-400" />
                  <textarea 
                    id="message" 
                    name="message" 
                    value={formData.message}
                    onChange={handleChange}
                    rows={6} 
                    placeholder="Please share your thoughts, suggestions, or concerns..." 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50 resize-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:from-primary/80 hover:to-secondary/80 transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* common Section */}
      <div>
        <Subscribe />
        <Partners />
      </div>
    </div>
  );
};

export default Page