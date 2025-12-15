"use client";
import Partners from "@/components/Partners";
import Image from "next/image";
import { motion } from "framer-motion";
import Subscribe from "@/components/Subscribe";
import { useEffect, useState } from 'react';
import { getArticleList } from "@/apis/article-api";
import Link from "next/link";

export default function Page() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async (pageNum) => {
    try {
      setLoading(true);
      const response = await getArticleList(pageNum, 10);
      
      const newArticles = response.values.rows.map(article => ({
        id: article.id,
        title: article.name,
        excerpt: article.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
        image: article.image_url,
        category: "MARKETING",
        date: {
          day: new Date(article.createdAt).getDate(),
          month: new Date(article.createdAt).toLocaleString('default', { month: 'short' }),
          year: new Date(article.createdAt).toLocaleString('default', { year: 'numeric' })
        },
        author: "ADMIN"
      }));
      
      setArticles(newArticles);
      setTotalPages(response.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchArticles(newPage);
    }
  };

  return (
    <div className="relative">
      {/* Hero Section (unchanged) */}
      <div className="relative  h-[500px]">
        <Image
          src="/images/home/articles/Transforming-Eswatini's-Handicraft-Industry.jpg"
          alt="Contact Hero"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
 
      </div>

      {/* Articles Grid */}
        <div className="text-center pt-10 mb-12">
          <span className="inline-block px-4 py-1 bg-gray-100 text-primary rounded-full text-sm font-medium mb-2">
            Recent Articles
          </span>
          <h2 className="text-3xl font-bold mb-4">Every Single MSME Journal</h2>
          <div className="flex justify-center">
            <div className="w-32 h-1 bg-gray-200 relative">
              <div className="w-12 h-1 bg-primary absolute left-1/2 -translate-x-1/2 top-0"></div>
            </div>
          </div>
        </div>      <div className="container  mx-auto px-4">
        <div className="grid grid-cols-1 pt-10 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white text-primary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <div className="relative h-64">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${article.image}`}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute bottom-4 right-4 bg-dark bg-opacity-90 text-white gap-1 rounded-md px-4 py-2 flex flex-row items-center shadow-md">
                  <span className="text-xs">{article.date.day}</span>
                  <span className="text-xs">{article.date.month}</span>
                  <span className="text-xs">{article.date.year}</span>
                </div>
              </div>
              <div className="bg-dark text-gray-200 text-xs font-semibold tracking-widest px-6 py-2 uppercase">
                By {article.author} _ {article.category}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-3">{article.title}</h3>
                <p className="text-gray-600 mb-6 flex-1">{article.excerpt}</p>
                <Link 
                  href={`/article-details/${article.id}`}
                  className="inline-flex items-center text-primary hover:text-secondary font-semibold group"
                >
                  <span className='hover:underline'>Continue Reading</span>
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 mb-8">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    pageNum === page 
                      ? 'bg-primary text-white' 
                      : 'border border-gray-300 hover:bg-gray-100'
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="mt-20">
        <Subscribe />
        <Partners />
      </div>
    </div>
  );
}