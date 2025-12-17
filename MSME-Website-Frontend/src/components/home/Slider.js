'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getHomeSliderList } from '@/apis/lists-api';

export default function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  
  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await getHomeSliderList(1, 10);
        if (response?.values?.rows) {
          const formattedSlides = response.values.rows.map((slide, index) => ({
            id: index + 1,
            bg: slide.image_url,
            title: slide.name,
            description: slide.description.replace(/<[^>]*>/g, ''), // Remove HTML tags
            buttonText: "READ MORE",
            buttonLink: slide.url || "/businesses"
          }));
          setSlides(formattedSlides);
        }
      } catch (error) {
        console.error('Error fetching slides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);
  
  // Add auto-sliding functionality
  useEffect(() => {
    if (slides.length === 0) return;
    
    const autoSlideInterval = setInterval(() => {
      goToNextSlide();
    }, 3000); // 3 seconds interval

    return () => clearInterval(autoSlideInterval);
  }, [slides]);

  useEffect(() => {
    const handleTouchStart = (e) => {
      startXRef.current = e.touches[0].clientX;
      isDraggingRef.current = true;
    };
    
    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
    };
    
    const handleTouchEnd = (e) => {
      if (!isDraggingRef.current) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = startXRef.current - endX;
      
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        if (diffX > 0) {
          // Swiped left, go to next slide
          setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        } else {
          // Swiped right, go to previous slide
          setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
        }
      }
      
      isDraggingRef.current = false;
    };
    
    // Mouse events for desktop
    const handleMouseDown = (e) => {
      startXRef.current = e.clientX;
      isDraggingRef.current = true;
      e.preventDefault(); // Prevent text selection during drag
    };
    
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
    };
    
    const handleMouseUp = (e) => {
      if (!isDraggingRef.current) return;
      
      const endX = e.clientX;
      const diffX = startXRef.current - endX;
      
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        if (diffX > 0) {
          // Dragged left, go to next slide
          setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        } else {
          // Dragged right, go to previous slide
          setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
        }
      }
      
      isDraggingRef.current = false;
    };
    
    const sliderElement = sliderRef.current;
    
    if (sliderElement) {
      // Touch events
      sliderElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      sliderElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      sliderElement.addEventListener('touchend', handleTouchEnd);
      
      // Mouse events
      sliderElement.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      if (sliderElement) {
        // Clean up touch events
        sliderElement.removeEventListener('touchstart', handleTouchStart);
        sliderElement.removeEventListener('touchmove', handleTouchMove);
        sliderElement.removeEventListener('touchend', handleTouchEnd);
        
        // Clean up mouse events
        sliderElement.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [slides.length]);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const limitWords = (text, maxWords) => {
  const words = text.split(' ');
  const truncated = words.slice(0, maxWords).join(' ');
  return words.length > maxWords ? `${truncated}...` : truncated;
  };

  return (
    <div 
      ref={sliderRef}
      className="relative h-[400px] sm:h-[500px] md:h-screen overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing"
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : slides.length > 0 ? (
        slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute left-0 w-full h-full ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              backgroundImage: `url('${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${slide.bg}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Add gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
            
            <div className="absolute right-4 sm:right-[30px] md:right-[70px] top-8 sm:top-12 md:top-16 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] h-full w-[90%] sm:w-[70%] max-w-[400px] md:w-1/3 flex items-center justify-center hidden md:flex">
              <div className="bg-black/20 backdrop-blur-3xl text-white px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20   w-full h-full flex flex-col justify-center rounded-lg border border-white/20 shadow-2xl transform transition-all duration-500 hover:scale-105">
                <h1 className="text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-6 font-bold leading-tight"> {limitWords(slide.title, 8)}</h1>
                <p className="text-xs sm:text-sm md:text-base mb-6 sm:mb-8 text-gray-200 leading-relaxed">{limitWords(slide.description, 10)}</p>
                <Link 
                  href={slide.buttonLink} 
                  className="inline-block w-fit bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 rounded-md text-sm sm:text-base font-semibold hover:bg-[#1e2f5d] transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">No slides available</p>
        </div>
      )}
      
      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPreviousSlide}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNextSlide}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Navigation Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 flex justify-center z-20">
          <div className='bg-white rounded-full px-2'>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 w-2 sm:h-2.5 sm:w-2.5 mx-1 rounded-full border border-gray-500 ${
                  index === currentSlide ? 'bg-[#2E458D] border-blue-300' : 'bg-transparent'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}