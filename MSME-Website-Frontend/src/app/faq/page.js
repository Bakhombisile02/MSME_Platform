"use client";
import Partners from "@/components/Partners";
import Subscribe from "@/components/Subscribe";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getFaqList } from '@/apis/lists-api';
import { sanitizeHTML } from "@/utils/sanitize";

const Page = () => {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const response = await getFaqList(1, 50);
        setFaqs(response.values.rows);
      } catch (error) {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="relative flex flex-col">
      <div className="relative h-[600px]">
        <Image src="/images/faq/faq_banner.jpg" alt="FAQ" fill className="object-cover" />
      </div>
      {/* FAQ Content */}
      <div className="max-w-7xl flex items-center justify-center  m-auto z-10 relative my-16">
        <div className="bg-white rounded-2xl shadow-xl  overflow-hidden">

          <div className="px-8 md:px-12 flex flex-col justify-start">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">Frequently Asked Questions</h2>
            {/* Accordion */}
            <div className="w-full py-5 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-400 animate-pulse">Loading...</div>
              ) : (
                faqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md"
                  >
                    <button
                      onClick={() => handleToggle(idx)}
                      className="w-full flex justify-between items-center px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                    >
                      <span className={`text-start text-base md:text-lg font-semibold transition-colors duration-300 ${
                        openIndex === idx ? 'text-red-600' : 'text-[#2E458D]'
                      }`}>
                        {faq.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                          openIndex === idx ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div
                      className={`px-6 bg-white text-gray-700 text-sm md:text-base overflow-hidden transition-all duration-500 ease-in-out ${
                        openIndex === idx ? 'max-h-[500px] py-4' : 'max-h-0 py-0'
                      }`}
                      style={{ transitionProperty: 'max-height, padding' }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(faq.answer) }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Subscribe />
      <Partners />
    </div>
  );
};
export default Page