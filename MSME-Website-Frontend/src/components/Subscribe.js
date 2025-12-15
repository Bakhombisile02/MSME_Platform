'use client'
import { useState } from 'react';
import { createSubscribe } from '@/apis/subscribe-api';
import { toast } from 'react-hot-toast';

export default function Subscribe() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    try {
      await createSubscribe({ email });
      toast.success('Thank you for subscribing!');
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="md:h-[350px] px-0 flex justify-center items-center bg-gray-100">
      <div className="w-full h-full bg-dark shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Content */}
        <div className="w-full md:w-[60%] py-8 md:px-40 flex flex-col items-center md:items-start justify-center">
          <div className="mb-2">
            <span className="inline-block bg-secondary text-xs text-white px-4 py-1 rounded mb-4 font-semibold tracking-wide">
              Our Newsletters
            </span>
          </div>
          <h2 className="text-xl md:text-3xl px-4 md:px-0 text-center md:text-left font-bold text-white mb-4 leading-tight">
            Sign up to receive the latest <br /> updates and news
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
            <div className="flex flex-col items-center md:items-start gap-3 md:gap-0 md:flex-row md:rounded-lg overflow-hidden shadow-md w-full md:max-w-md">
              <input
                type="email"
                placeholder="Write your email"
                className="flex-grow w-[80%] md:w-full rounded-md md:rounded-none py-3 px-4 text-gray-800 focus:outline-none bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/3 md:w-auto rounded-md md:rounded-none bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-3 md:py-auto md:px-6 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>
        </div>
        {/* Right: Illustration */}
        <div className="hidden md:flex w-[40%] relative items-center justify-center">
          {/* Curve SVG - only on md+ screens */}
          <svg
            className="hidden md:block absolute -left-1 top-0 h-full w-24 z-20"
            viewBox="0 0 100 300"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ minWidth: '96px', transform: 'scaleX(-1)' }}
          >
            <path
              d="M0,0 Q100,150 0,300 L100,300 L100,0 Z"
              fill="#111C2A" // Use your card's background color here
            />
          </svg>
          {/* Mailbox illustration */}
          <div className="relative bg-white z-10 flex items-center justify-center w-full h-full">
            <img src="/images/signup-emails-amico.svg" alt="Mailbox" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}