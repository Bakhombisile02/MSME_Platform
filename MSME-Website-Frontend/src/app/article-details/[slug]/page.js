"use client";
import Image from "next/image";
import { FaCalendar } from "react-icons/fa6";
import { getArticleById, getArticleList } from "@/apis/article-api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Subscribe from "@/components/Subscribe";
import Partners from "@/components/Partners";
import Link from "next/link";
import { sanitizeHTML } from "@/utils/sanitize";

 

const Page = () => {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState();
  const [latestData,setLatestData]=useState()


    const fetchLatestNews = async () => {
      try {
        setLoading(true);
        const response = await getArticleList(1, 6);
        console.log(response.values.rows)
        if (response.values.rows) {
        const newArticles = response.values.rows.map(article => ({
          id: article.id,
          title: article.name,
          excerpt: article.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
          image: article.image_url,
          category: "MARKETING", 
           date: `${new Date(article.createdAt).getDate()} ${new Date(article.createdAt).toLocaleString('default', { month: 'short' ,    year: 'numeric'})}`,          author: "ADMIN"  
        }));
        setLatestData(newArticles)
        console.log('newArticles',newArticles)
        }
      } catch (err) {
        console.error('Error fetching Article:', err);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    const fetchArticleById = async () => {
      try {
        setLoading(true);
        const response = await getArticleById(params.slug);
        if (response) {
          setArticle(response);
        }
      } catch (err) {
        console.error('Error fetching Article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestNews()
    fetchArticleById();
  }, [params]);  

  // Format date
  const formattedDate = new Date(article?.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Article not found</h2>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className=" relative h-[600px]">
        <Image
          src="/images/feedback/front.jpg"
          alt="Contact Hero"
          fill
          className="object-cover"
        />
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
      <div className="flex flex-col p-5 gap-5 md:flex-row gap-4 max-w-7xl mx-auto my-10">
        {/* Article Section */}
        <div className="flex-3/5">
          <h1 className="text-4xl font-semibold">{article.name}</h1>
          <div className="flex items-center gap-4 my-8 text-black">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <Image
                  src="/images/Details_page/profile_img.jpg"
                  alt="Author Avatar"
                  width={26}
                  height={26}
                  className="object-cover rounded-full"
                />
              </div>
              <span className="text-sm font-semibold">By {article.uploaded_by || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="border rounded-full p-1">
                <FaCalendar size={14} />
              </div>
              <span className="text-sm font-semibold">{formattedDate}</span>
            </div>
          </div>
          <hr className="text-primary/20"/>
          <div>
            <Image
              src={`${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${article.image_url}`}
              alt={article.name}
              width={900}
              height={300}
              className="object-cover my-6 rounded-lg"
            />
            <div 
              className="text-[15px] leading-6 text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.description) }}
            />
          </div>
        </div>
        {/* Latest post section */}
        <div className="flex-1/5 h-fit border border-primary/20">
          <div className=" w-full rounded-xl">
            <div className="text-2xl px-6 py-4 text-white font-semibold mb-4 bg-primary">Latest Posts</div>
            <div className="p-6 space-y-6">
              {latestData?.map((post) => (
              <Link  key={post.id}
                  href={`/article-details/${post.id}`}
                  className="inline-flex items-center text-primary hover:text-secondary font-semibold group"
                >                
                <div  className="flex items-start gap-4 border-b border-primary/20 pb-4">
                  <Image src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${post.image}`} alt={post.title} width={80} height={80} className="object-cover rounded-lg" />
                  <div className="flex flex-col justify-between">
                    <h3 className="text-base font-medium  line-clamp-2">{post.title}</h3>
                    <span className="text-sm text-gray-400">{post.date}</span>
                  </div>
                </div>
                </Link>
              ))}
              <div className="text-center bg-gray-100 py-2">
                <Link 
                  href={`/article`}
                  className="inline-flex items-center text-primary hover:text-secondary font-semibold group"
                >
                  <span className='hover:underline'>View All</span>
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Link>
               </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Subscribe />
        <Partners />
      </div>
    </div>
  );
};

export default Page