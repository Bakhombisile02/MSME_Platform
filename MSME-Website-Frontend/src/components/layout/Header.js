'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { RxCross2 } from 'react-icons/rx';
import { FaUser, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { RiArrowDropDownLine } from 'react-icons/ri';
import Image from 'next/image';

export default function Header() {
  const { logout, isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className='outline-none'>
          <Image src={"/images/logo_msme.png"} alt="MSME Logo" width={80} height={70} style={{ height: 'auto' }} className="cursor-pointer outline-none" />
        </Link>


        {/* Desktop Menu */}
        <nav className="flex items-center space-x-4 md:space-x-2 lg:space-x-8 text-sm whitespace-nowrap font-medium">
        {/* Always visible links - adjust visibility based on breakpoint */}
        <Link href="/" className="hover:text-primary hidden md:block">Home</Link>
        <Link href="/about" className="hover:text-primary hidden md:block">About Us</Link>
        <Link href="/service-providers" className="hover:text-primary hidden md:block">Service Providers</Link>

        {/* Dropdown - visible from md upwards */}
        <div className="relative group hidden md:block">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <span className="font-medium">Other</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute -left-6 w-[17rem] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out z-20 transform origin-top">
            <div className="bg-white rounded-xl shadow-xl mt-2 border border-gray-100 overflow-hidden backdrop-blur-sm bg-opacity-95">
              <div className="p-1.5">
                <Link href="/feedback" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-gray-700 hover:text-primary group/item">
                  <span className="font-medium">Feedback</span>
                  <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                </Link>
                <Link href="/faq" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-gray-700 hover:text-primary group/item">
                  <span className="font-medium">FAQ</span>
                  <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                </Link>
                <Link href="/article" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-gray-700 hover:text-primary group/item">
                  <span className="font-medium">Article</span>
                  <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                </Link>
                <Link href="/latest-news-and-documents" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-gray-700 hover:text-primary group/item">
                  <span className="font-medium">Latest News and Documents</span>
                  <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Contact - visible from md upwards */}
        <Link href="/contact" className="hover:text-primary hidden md:block">Contact Us</Link>
        </nav>

        {/* Profile section with Add Business button */}
        <div className="hidden md:flex   items-center gap-2">
          {!isLoggedIn && (
            <Link href="/add-business" className="bg-[#2E458D] md:text-sm whitespace-nowrap text-white md:px-4 py-2 rounded hover:bg-primary/90">
              + Add Business
            </Link>
          )}
          <div 
            className="relative"
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center hover:from-primary/30 hover:to-primary/20 transition-all duration-200 ring-2 ring-primary/10 hover:ring-primary/20">
                <FaUser className="text-primary" size={16} />
              </div>
              <RiArrowDropDownLine size={24} className='   '  />
            </button>
            {isLoggedIn ? (
              <div className={`absolute right-0 pt-2 w-56 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden backdrop-blur-sm bg-opacity-95 transition-all duration-300 ease-out transform origin-top ${isProfileOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-2 scale-95'} z-20`}>
                <div className="p-1.5">
                  <Link href="/add-business" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-gray-700 hover:text-primary group/item">
                    <span className="font-medium">My Business</span>
                    <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-50 transition-all duration-200 text-red-600 group/item"
                  >
                    <FaSignOutAlt size={14} />
                    <span className="font-medium">Logout</span>
                    <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`absolute right-0 pt-2 w-56 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden backdrop-blur-sm bg-opacity-95 transition-all duration-300 ease-out transform origin-top ${isProfileOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-2 scale-95'} z-20`}>
                <div className="p-1.5">
                  <Link href="/login" className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-200 text-secondary group/item">
                    <FaSignInAlt size={14} />
                    <span className="font-medium">Login</span>
                    <span className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMenu}>
            <HiOutlineMenuAlt3 size={30} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white z-50 transition-transform duration-500 ease-in-out p-6 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex justify-end mb-6">
          <button onClick={toggleMenu}>
            <RxCross2 size={25} />
          </button>
        </div>
        <nav className="flex flex-col space-y-6 font-medium">
          <Link href="/" onClick={toggleMenu}>Home</Link>
          <Link href="/about" onClick={toggleMenu}>About Us</Link>
          <Link href="/service-providers" onClick={toggleMenu}>Service Providers</Link>
          <Link href="/feedback" onClick={toggleMenu}>Feedback</Link>
          <Link href="/faq" onClick={toggleMenu}>FAQ</Link>
          <Link href="/article" onClick={toggleMenu}>Article</Link>
          <Link href="/latest-news-and-documents" onClick={toggleMenu}>Latest News and Documents</Link>
          <Link href="/contact" onClick={toggleMenu}>Contact Us</Link>
          {!isLoggedIn && (
            <Link href="/add-business" onClick={toggleMenu} className="bg-primary text-white text-center py-2 rounded">
              + Add New Business
            </Link>
          )}
          <hr className='text-primary/40'/>
          {/* Mobile Profile section */}
          <div className="md:hidden">
            {isLoggedIn ? (
              <div className="flex items-start flex-col gap-4 space-x-4">
                <Link href="/add-business" onClick={toggleMenu} className="hover:text-primary">My Business</Link>
                <button 
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="text-red-600 flex items-center gap-2"
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" onClick={toggleMenu} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 flex items-center gap-2">
                  <FaSignInAlt size={14} />
                  Login
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}