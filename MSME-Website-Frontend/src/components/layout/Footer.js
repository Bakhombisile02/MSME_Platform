"use client"
import { getBusinessCategoryList } from '@/apis/business-category-api';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer () {
  const currentYear = new Date().getFullYear();
  const [ categories, setCategories ] = useState( [] );

    useEffect( () => {
      const fetchCategories = async () => {
        try {
          const response = await getBusinessCategoryList( 1, 4 );
          if ( response?.values?.rows ) {
            setCategories( response.values.rows );
          }
        } catch ( err ) {
          console.error( 'Error fetching categories:', err );
        } 
      };
  
      fetchCategories();
    }, [] );
  return (
    <footer className="relative text-white pt-0 pb-4" style={ { fontFamily: 'var(--font-montserrat)' } }>
      {/* Background image with overlay */ }
      <div className="absolute inset-0 w-full">
        <Image src="/images/footer-bg-1.jpg" fill alt="Footer background"/>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-black/40 to-black/70" />
      </div>
      <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-8 mt-52">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 justify-start items-start lg:items-stretch mb-12">
          {/* Logo and description */ }
          <div className="max-w-[600px] min-w-[300px] flex flex-col items-start text-left mb-8 lg:mb-0">
            <div className='w-[130px] flex items-center justify-center bg-white/90 rounded-lg p-4 shadow-lg'>
              <Image src="/images/logo_msme.png" alt="MSME Logo" width={90} height={90} className="object-contain" />
            </div>
            <p className="text-sm text-gray-100 lg:mx-0 [@media(min-width:600px)]:mt-4 md:mt-0 md:ml-0 mb-2">CEEC advocates for policy reforms and creates an enabling environment for businesses in the MSME sector to thrive.</p>
          </div>
          <div className='flex [@media(min-width:600px)]:flex-row flex-col gap-12 justify-start items-start [@media(min-width:600px)]:items-stretch'>
            {/* Explore */ }
            <div className="flex-1 min-w-[160px] mb-8 lg:mb-0">
              <h3 className="text-xl font-semibold mb-4 tracking-wide">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-secondary transition">Home</Link></li>
                <li><Link href="/about" className="hover:text-secondary transition">About Us</Link></li>
                <li><Link href="/service-providers" className="hover:text-secondary transition">Service Providers</Link></li>
                <li><Link href="/faq" className="hover:text-secondary transition">FAQs</Link></li>
                <li><Link href="/feedback" className="hover:text-secondary transition">Feedback</Link></li>
              </ul>
            </div>
            {/* Categories */ }
            <div className="flex-1 min-w-[160px] mb-8 lg:mb-0">
              <h3 className="text-xl font-semibold mb-4 tracking-wide">Categories</h3>
              <ul className="space-y-2 text-sm">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/categories?categoryId=${category.id}`} 
                      className="hover:text-secondary transition"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                    <Link 
                      href={`/all-categories`} 
                      className="hover:text-secondary transition"
                    >
                    View All
                    </Link>
              </ul>
            </div>
            {/* Contact */ }
            <div className="flex-1 min-w-[220px]">
              <h3 className="text-xl font-semibold mb-4 tracking-wide">Contact</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <span className="inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  <span>Lorem ipsum dolor sit amet</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <a href="tel:+26876999719" className="hover:text-secondary transition">+268 7699 9719</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <span>info@msme.co.sz</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Copyright and Socials */ }
      <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-white/20 pt-6 pb-2 relative">
        <p className="text-center text-base">Copyright &copy; { currentYear } MSME | Powered by MSME</p>
        <div className="flex gap-3 mt-4 md:mt-0 md:absolute md:right-0 md:bottom-2">
          <a href="https://www.facebook.com/share/17kHhGJYKJ/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-md p-2 shadow hover:scale-105 transition" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2E458D"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
          </a>
          <a href="#" className="bg-white rounded-md p-2 shadow hover:scale-105 transition" aria-label="X">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2E458D"><path d="M17.53 6.47a.75.75 0 0 0-1.06 0L12 10.94 7.53 6.47a.75.75 0 1 0-1.06 1.06L10.94 12l-4.47 4.47a.75.75 0 1 0 1.06 1.06L12 13.06l4.47 4.47a.75.75 0 0 0 1.06-1.06L13.06 12l4.47-4.47a.75.75 0 0 0 0-1.06z" /></svg>
          </a>
          <a href="#" className="bg-white rounded-md p-2 shadow hover:scale-105 transition" aria-label="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2E458D"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}