import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight } from "react-icons/fa6";
// import { motion } from 'framer-motion';

export default function AboutSection () {
  const locations = [
    { name: "Manzini", image: "/images/home/my-locations/manzini11.jpg", description: "Vibrant commercial hub of Eswatini" },
    { name: "Hhohho", image: "/images/home/my-locations/Hhohho1.jpg", description: "Home to the capital city Mbabane" },
    { name: "Lubombo", image: "/images/home/my-locations/Lubombo1.jpg", description: "Known for its beautiful landscapes" },
    { name: "Shiselweni", image: "/images/home/my-locations/Shiselweni.jpg", description: "Rich cultural heritage region" }
  ]
  return (
    <section className="overflow-hidden">
      {/* About CEEC Section */}
      <div className="flex flex-col lg:flex-row min-h-[500px] sm:min-h-[600px]">
        <div className="w-full lg:w-1/2 relative overflow-hidden group h-[300px] sm:h-[400px] lg:h-auto">
          <Image
            src="/images/home/about-home.jpg"
            alt="About CEEC"
            width={1000}
            height={800}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 lg:opacity-100"></div>
        </div>
        <div className="w-full lg:w-1/2 bg-dark font-[400] text-white py-10 sm:py-12 lg:py-16 px-6 sm:px-8 lg:px-16 flex flex-col justify-center">
          <div className="max-w-xl">
            <h2 className="text-base sm:text-lg uppercase font-semibold mb-4 sm:mb-6 relative inline-block">
              <span className="relative text-[16px] sm:text-[18px] z-10">About CEEC</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform"></span>
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-[500] mb-6 sm:mb-8 leading-tight">We Work with you to <span className="text-secondary">Make your Vision</span> a Reality.</h3>
            <p className="mb-6 sm:mb-8 text-gray-300 leading-relaxed text-[14px] sm:text-[15px]">
              MSMEs in Eswatini are growing at an exponential rate. They employ the masses, thereby
              providing opportunities for income generation to the populous of Eswatini. In order to
              sustain their present growth and create a platform to further amplify their potential, CEEC
              provides assistance to MSMEs to make their vision a reality. As the leading agency, created
              for the coordination of activities in the MSME sector,
            </p>
            <div className="mt-4 sm:mt-6 border-t border-gray-700 pt-4 sm:pt-6 flex md:justify-end justify-start">
              <Link
                href="/about"
                className="group flex items-center gap-2 text-white font-semibold hover:text-secondary transition-colors duration-300"
                aria-label="Read more about CEEC"
              >
                <span>Read More About Us</span>
                <FaArrowRight className="transform transition-transform duration-300 group-hover:translate-x-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Explore By Locations Section */}
      <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-base sm:text-lg uppercase font-semibold text-gray-500 mb-2">OUR PLACE</h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Explore By Locations</h3>
            <div className="w-16 sm:w-20 lg:w-24 h-1 bg-[#2E458D] mx-auto mt-3 sm:mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {locations.map((location, index) => (
              <Link href={`/categories?region=${location.name}`} key={index}>
              <div className="relative rounded-lg overflow-hidden shadow-lg group h-[280px] sm:h-[320px] lg:h-[360px] transform transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:-translate-y-1 hover:shadow-xl will-change-transform">
                  <div className="h-full relative">
                    <Image
                      src={location.image}
                      alt={location.name}
                      fill
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  className="object-cover transition-transform duration-600 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-110 will-change-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

                    {/* Location details overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transition-all duration-200 ease-out">
                      <div className="flex flex-col items-center justify-center bg-white/90 border backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-md 
                          transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] 
                          transform origin-bottom 
                          group-hover:-translate-y-2
                          group-hover:shadow-lg">
                        <h4 className="text-xl sm:text-2xl font-bold text-center text-black mb-1 transition-all duration-300 group-hover:mb-2 group-hover:text-2xl sm:group-hover:text-3xl">
                          {location.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 text-center 
                            opacity-0 max-h-0 overflow-hidden 
                            group-hover:opacity-100 group-hover:max-h-[200px] 
                            transition-all duration-500 ease-in-out 
                            group-hover:mt-2">
                          {location.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}