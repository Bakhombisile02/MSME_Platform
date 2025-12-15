"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getArticleList } from '../../apis/article-api';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchArticles = async (pageNum) => {
    try {
      setLoading(true);
      const response = await getArticleList(pageNum, 3);
      const newArticles = response.values.rows.map(article => ({
        id: article.id,
        title: article.name,
        excerpt: article.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
        image: article.image_url,
        category: "MARKETING", // Default category since it's not in API
        date: {
          day: new Date(article.createdAt).getDate(),
          month: new Date(article.createdAt).toLocaleString('default', { month: 'short' }),
          year: new Date(article.createdAt).toLocaleString('default', { year: 'numeric' })
        },
        author: "ADMIN" // Default author since it's not in API
      }));
      console.log('newArticles',newArticles)
      if (pageNum === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }

      setHasMore(pageNum < response.total_pages);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(1);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArticles(nextPage);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-gray-100 text-primary rounded-full text-sm font-medium mb-2">
            Recent Articles
          </span>
          <h2 className="text-3xl font-bold mb-4">Every Single MSME Journal</h2>
          <div className="flex justify-center">
            <div className="w-32 h-1 bg-gray-200 relative">
              <div className="w-12 h-1 bg-primary absolute left-1/2 -translate-x-1/2 top-0"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div key={article.id} className="bg-white text-primary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <div className="relative h-64">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${article.image}`}
                  // src={`${article.image}`}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Date badge */}
                <div className="absolute bottom-4 right-4 bg-dark bg-opacity-90 text-white gap-1 rounded-md px-4 py-2 flex flex-row items-center shadow-md">
                  <span className="text-xs  ">{article.date.day}</span>
                  <span className="text-xs  ">{article.date.month}</span>
                  <span className="text-xs  ">{article.date.year}</span>
                </div>
              </div>
              {/* Category/author bar */}
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
        
        <div className="text-center mt-12">
          {hasMore && (
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-white border border-primary text-primary px-8 py-3 rounded-md font-semibold hover:bg-primary hover:text-white transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}