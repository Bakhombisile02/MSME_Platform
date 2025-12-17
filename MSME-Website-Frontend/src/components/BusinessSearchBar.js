'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * BusinessSearchBar - A reusable search component for finding businesses
 * Can be used on homepage, header, or any page
 * 
 * @param {Object} props
 * @param {string} props.variant - 'hero' (large) or 'compact' (small for header)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showHints - Show popular search hints
 * @param {Function} props.onSearch - Optional callback after search
 */
export default function BusinessSearchBar({ 
  variant = 'hero', 
  className = '',
  showHints = true,
  onSearch 
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const popularSearches = ['Bakery', 'IT Services', 'Construction', 'Agriculture', 'Retail'];

  const handleSearch = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/categories?keyword=${encodeURIComponent(query)}`);
      onSearch?.(query);
    } else {
      router.push('/categories');
    }
  };

  const handleHintClick = (hint) => {
    setSearchQuery(hint);
    router.push(`/categories?keyword=${encodeURIComponent(hint)}`);
    onSearch?.(hint);
  };

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSearch} className={`flex items-center ${className}`}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-48 md:w-64 px-4 py-2 pr-10 text-sm border border-gray-300 rounded-full focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary transition-colors"
          >
            🔍
          </button>
        </div>
      </form>
    );
  }

  // Hero variant (default)
  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
        <div className={`flex flex-col sm:flex-row gap-2 transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full p-4 pr-12 text-lg border-0 rounded-lg shadow-xl focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              placeholder="Search business name, services, products, location..."
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
          </div>
          <button
            type="submit"
            className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-xl hover:shadow-2xl"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search hints */}
      {showHints && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <span className="text-white/70 text-sm">Popular:</span>
          {popularSearches.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => handleHintClick(hint)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors backdrop-blur-sm"
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* Search explanation */}
      <p className="text-white/80 text-sm mt-3 text-center">
        Search across business names, categories, services, products, descriptions & locations
      </p>
    </div>
  );
}
