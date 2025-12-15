"use client"
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getPartnersLogoList } from '@/apis/lists-api';

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await getPartnersLogoList(1, 100); // Using high limit to get all partners
        const partnersData = response.values.rows;
        // Duplicate the partners for continuous scrolling
        setPartners([...partnersData, ...partnersData]);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || loading) return;
    
    let animationId;
    let scrollAmount = 0;
    const scrollSpeed = 0.5; // Pixels per frame - lower for slower scrolling
    const totalWidth = scrollContainer.scrollWidth;
    const visibleWidth = scrollContainer.clientWidth;
    
    const scroll = () => {
      scrollAmount += scrollSpeed;
      
      // Reset scroll position when we've scrolled through half the content
      // This creates a seamless infinite scroll effect
      if (scrollAmount >= (totalWidth - visibleWidth) / 2) {
        scrollAmount = 0;
      }
      
      scrollContainer.scrollLeft = scrollAmount;
      animationId = requestAnimationFrame(scroll);
    };
    
    // Start the animation
    animationId = requestAnimationFrame(scroll);
    
    // Pause scrolling when hovering
    const handleMouseEnter = () => {
      cancelAnimationFrame(animationId);
    };
    
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(scroll);
    };
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [loading]);

  return (
    <section className="pt-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-lg uppercase font-semibold text-gray-500">Our Partners</h2>
          <h3 className="text-3xl font-bold mb-8">Working with us to grow the MSME sector​</h3>
        </div>
        
        {/* Horizontal scrolling partner logos */}
        <div className="relative">
          {/* Custom left/right fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          {/* Scrollable container */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto pb-4 scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              <div className="flex justify-center items-center w-full h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex space-x-12 px-10">
                {partners.map((partner, index) => (
                  <a 
                    key={`${partner.id}-${index}`}
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-40 h-32 bg-white rounded-lg p-3 flex items-center justify-center hover:grayscale transition-all duration-300 hover:scale-95"
                  >
                    <div className="relative w-32 h-24">
                      <Image 
                        src={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${partner.icon_url}`}
                        alt={partner.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}