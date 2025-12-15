"use client";
import Partners from '@/components/Partners';
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { FaBuilding, FaGlobeAmericas, FaHandshake, FaHouseUser, FaLandmark, FaLaptop, FaMinus, FaRocket, FaUsers } from 'react-icons/fa';
import { FaYoutube } from 'react-icons/fa6';
import { getTeamMembersList } from '@/apis/lists-api';
import Subscribe from '@/components/Subscribe';
import Link from 'next/link';
import { MdStorage } from "react-icons/md";


const Page = () => {
  const [ teamMembers, setTeamMembers ] = useState( [] );
  const [ loading, setLoading ] = useState( true );

  useEffect( () => {
    const fetchTeamMembers = async () => {
      try {
        setLoading( true );
        const response = await getTeamMembersList( 1, 10 );
        setTeamMembers( response.values.rows );
      } catch ( error ) {
        console.error( 'Error fetching team members:', error );
      } finally {
        setLoading( false );
      }
    };

    fetchTeamMembers();
  }, [] );

  return (
    <>
      <div className='min-h-screen text-gray-400'>
        <div className="about_bg h-52 sm:h-[95vh] w-full relative">
          <svg
            className="absolute -bottom-0.5 left-0 w-full rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <path
              className="fill-gray-100"
              d="M0,50
              C125,100 375,0 500,50
              C625,100 875,0 1000,50
              L1000,0
              L0,0
              Z"
            />
          </svg>
        </div>
        {/* Mission Vision Values */}
        <div className='p-6 bg-gray-450 pt-16 pb-10'>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 bg-primary bg-clip-text text-transparent">
              Mission Vision Values
            </h2>
            <div className="w-48 h-1 bg-gradient-to-r from-secondary via-primary to-primary mx-auto rounded-full"></div>
          </div>

          {/* Mission & Vision Row */}
          <div className="max-w-6xl mx-auto pt-10 grid grid-cols-1 sm:grid-cols-2 gap-10 p-5 md:p-10">
            {/* Mission */}
            <div className="flex flex-col items-center text-center space-y-6 p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white min-h-[420px] w-full">
              <Image
                src="/images/about_us/mission-111.png"
                alt="Mission Logo"
                width={120}
                height={120}
                className="w-32 h-32 object-contain transition duration-300"
                style={{ filter: "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)" }}
                onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9) contrast(100%) saturate(100%) blur(0px) hue-rotate(45deg)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)"; }}
              />
              <h3 className="text-2xl font-bold text-primary">Mission</h3>
              <p className="text-base font-medium">
                To catalyse sustainable economic empowerment for all Swazi citizens by providing accessible financial support, capacity-building, mentorship, and market-linked opportunities.
              </p>
            </div>
            {/* Vision */}
            <div className="flex flex-col items-center text-center space-y-6 p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white min-h-[420px] w-full">
              <Image
                src="/images/about_us/vission-111.png"
                alt="Vision Logo"
                width={120}
                height={120}
                className="w-32 h-32 object-contain transition duration-300"
                style={{ filter: "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)" }}
                onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9) contrast(100%) saturate(100%) blur(0px) hue-rotate(45deg)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = "brightness(100%) contrast(100%) saturate(100%) blur(0px) hue-rotate(0deg)"; }}
              />
              <h3 className="text-2xl font-bold text-secondary">Vision</h3>
              <p className="text-base font-medium">
                A thriving, inclusive economy where every citizen has opportunity and agency to create, grow, and sustain profitable enterprises.
              </p>
            </div>
          </div>

          {/* Core Values Card with Image */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-0 flex flex-col md:flex-row overflow-hidden">
              {/* Image section */}
              <div className="flex-shrink-0 flex items-center justify-center bg-gray-50 p-8 md:p-10 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100">
                <Image
                  src="/images/about_us/values-111.png"
                  alt="Values Logo"
                  width={140}
                  height={140}
                  className="w-32 h-32 md:w-36 md:h-36 object-contain"
                />
              </div>
              {/* Values list section */}
              <div className="flex-1 flex flex-col justify-center p-8 md:p-10">
                <h3 className="text-xl font-bold text-center md:text-left mb-6 text-purple-700">Core Values</h3>
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <span className="text-primary text-lg mt-1"><FaUsers /></span>
                    <span><span className="font-semibold text-gray-800">Inclusivity &amp; Equity</span> – Prioritize underserved groups in all programs</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-secondary text-lg mt-1"><FaLandmark /></span>
                    <span><span className="font-semibold text-gray-800">Integrity &amp; Transparency</span> – Demonstrate accountability in every operation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600 text-lg mt-1"><FaRocket /></span>
                    <span><span className="font-semibold text-gray-800">Innovation &amp; Excellence</span> – Encourage creativity and high performance</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-600 text-lg mt-1"><FaGlobeAmericas /></span>
                    <span><span className="font-semibold text-gray-800">Sustainability</span> – Support ventures with lasting social, economic, and environmental benefits</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-600 text-lg mt-1"><FaHandshake /></span>
                    <span><span className="font-semibold text-gray-800">Partnership</span> – Collaborate with government, private sector, and communities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* About Us section */ }
        <div className="relative bg-white py-20 px-6 md:px-10">
          <div className="relative max-w-7xl mx-auto">
            {/* Section Header */ }
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 bg-primary bg-clip-text text-transparent">
                About Us
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-secondary via-primary to-primary  mx-auto rounded-full"></div>
            </div>

            {/* About Us Content */ }
            <div className="mb-16">
              <div className="items-start leading-relaxed">
                <div>
                  <p className="text-gray-600 mb-4">
                    The CEEC is a government-backed institution dedicated to empowering Swazi citizens—especially youths, women, and persons with disabilities—through equitable access to funding, training, and mentorship. Since our inception, we have fostered entrepreneurship and inclusive economic growth by dismantling traditional barriers to capital and business know-how.
                  </p>
                  <p className="text-gray-600 mb-4">
                    The Citizens Economic Empowerment Council (CEEC) is an autonomous, statutory body established under the Citizens Economic Empowerment Act (CEEA) to lead, coordinate, and regulate Eswatini&apos;s citizen economic empowerment agenda. The Council exists to drive transformative, inclusive economic policies that give Swazi citizens greater participation, ownership, and benefit in the national economy.
                  </p>
                  <p className="text-gray-600 mb-4">
                    CEEC plays a non-financial, policy and oversight role. It does not offer direct funding, but instead serves as a regulatory and facilitative body responsible for the design, implementation, and monitoring of empowerment mechanisms. These include preferential procurement policies, compliance monitoring frameworks, capacity-building programs, and the development of strategic partnerships aimed at unlocking opportunities for historically disadvantaged Swazi citizens—especially women, youth, rural communities, and persons with disabilities.
                  </p>
                  <p className="text-gray-600 mb-4">
                    CEEC is the custodian of the Citizens Economic Empowerment Act and advises government on empowerment regulations, ensuring that public and private sector institutions comply with inclusion mandates. One of its major functions is to work closely with ministries, state-owned enterprises, local authorities, and the private sector to ensure that tenders and procurement contracts (up to E10 million) are reserved for citizen-owned companies, as per the Act.
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose Section - Full Width Card Layout */ }
            <div className="space-y-12">
              {/* Purpose Header */ }
              <div className="text-center">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-4 bg-primary bg-clip-text text-transparent">
                    Our Purpose
                  </h2>
                  <div className="w-28 h-1 bg-gradient-to-r from-secondary via-primary to-primary  mx-auto rounded-full"></div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed max-w-5xl mx-auto">
                  The Council also supports economic empowerment through:
                </p>
              </div>

              {/* Purpose Cards Grid - Full Width */ }
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Reframe Identity */ }
                <div className="group bg-white/60 backdrop-blur-md flex items-start justify-center rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaRocket className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-800">Developing regulations and guidelines on citizen ownership thresholds</h4>
                    </div>
                  </div>
                </div>

                {/* Digital Registry */ }
                <div className="group bg-white/60 backdrop-blur-md flex items-start justify-center rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MdStorage className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-800">	Monitoring procurement transactions to curb fronting and enforce compliance</h4>
                    </div>
                  </div>
                </div>

                {/* Core Engagement */ }
                <div className="group bg-white/60 backdrop-blur-md  flex items-start justify-center  rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaUsers className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-800">	Strengthening institutional collaboration with development partners</h4>
                    </div>
                  </div>
                </div>

                {/* Global Alignment */ }
                <div className="group bg-white/60 backdrop-blur-md  flex items-start justify-center   rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaGlobeAmericas className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-800">Raising awareness and training stakeholders on empowerment law and compliance</h4>
                    </div>
                  </div>
                </div>

                {/* Strategic Partnerships */ }
                <div className="group bg-white/60 backdrop-blur-md  flex items-start justify-center   rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaHandshake className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-gray-800">Advising on sector-specific empowerment targets and localization strategies</h4>
                    </div>
                  </div>
                </div>

                {/* Service Uptake */ }
                <div className="group bg-white/60 backdrop-blur-md  flex items-start justify-center   rounded-2xl p-8 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:bg-white/80 hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-[50px] h-[50px] bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaLaptop className="text-white text-xl" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-gray-800 mb-2">Maintaining oversight of national economic transformation indicators</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center flex flex-col gap-4">
                <p className="text-gray-600 text-lg leading-relaxed max-w-6xl mx-auto">
                  CEEC ensures that citizen empowerment is embedded in Eswatini&apos;s national development, aligned with the National Development Plan (2023-2028) and the UN Sustainable Development Goals (SDGs). The Council works in partnership with institutions like Business Eswatini, the Ministry of Commerce, development agencies, academia, and regulatory authorities to mainstream empowerment across all sectors of the economy.
                </p>
                <p className='text-gray-600 text-lg leading-relaxed font-extralight max-w-5xl mx-auto'>Through its work, CEEC aims to correct historical imbalances, strengthen indigenous enterprise participation in productive sectors, and build a resilient, equitable economic future for all Swazi citizens.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-black-150  text-white py-16 px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left: Text Section */ }
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Historical Emphasis
              </h2>
              <p className="text-gray-300 mb-6">
                Founded in 2023, CEEC emerged as part of Eswatini&apos;s broader social-economic reforms. Its early milestones include:
              </p>
              <div className='flex flex-col items-start justify-center gap-2'>
                <div className="flex items-start gap-2">
                  <span className="text-secondary mt-1">
                    <FaRocket />
                  </span>
                  <span>Milestone achievements: MSME accelerators, regionally scaled outreach</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-secondary mt-1">
                    <FaHandshake />
                  </span>
                  <span>Strategic partnerships with institutions like financial services, tech hubs, and agricultural cooperatives</span>
                </div>
              </div>
              <hr className="border-gray-700 my-8" />
              <div className="flex items-center gap-3">
                <FaYoutube className='w-16 h-16' />
                <p className="text-gray-400 text-sm">
                  CEECs management presented a strategic plan for Eswatini&apos;s MSME sector to our national and international partners. Watch the complete video of this session on YouTube.
                </p>
              </div>
            </div>
            {/* Right: Image Section */ }
            <div>
              <Image
                src="/images/about_us/4111.jpg"
                width={ 800 }
                height={ 1000 }
                alt="MSME in Eswatini"
                className="rounded-[2rem] object-cover"
              />
            </div>
          </div>
        </div>
        {/* Our Team */ }
        <div className="py-16 p-3  bg-gray-100">
          <div className=' flex flex-col sm:flex-row justify-between sm:gap-20 px-4 max-w-6xl mx-auto'>
            <div className=" sm:mb-12">
              <h2 className="text-sm uppercase  font-semibold text-gray-500">Our Team</h2>
              <h3 className="text-3xl font-bold py-5 text-black/80">Meet Our Leadership Team</h3>
            </div>
            <div>
              <Link className='' href={ "/about/members" } >
                <button className="blue-750 cursor-pointer whitespace-nowrap text-white px-6 py-3 mt-5 rounded hover:opacity-90 transition">
                  All Members
                </button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 lg:grid-cols-4   items-center text-center  gap-5 max-w-6xl  m-auto    mx-auto">
            {/* <div className="flex flex-wrap justify-center gap-20 px-4 py-8 mx-auto"> */ }
            {/* Team Member Card */ }
            { loading ? (
              <div className="flex justify-center items-center w-full h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              teamMembers.slice( 0, 4 ) ).map( ( member ) => (
                <div
                  key={ member.id }
                  className="bg-white flex m-auto rounded flex-col  shadow-md  w-[220px] text-center"
                >
                  <Image
                    src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${member.url}` }
                    alt={ member.name }
                    width={ 220 }
                    height={ 200 }
                    className=" w-full h-58 rounded-t  object-cover mb-4"
                  />
                  <div className='py-4'>
                    <div className='bg-white px-5  rounded-t w-fit -mt-12 items-center m-auto p-2 '>
                      <h4 className="text-blue-750 font-bold text-md">{ member.name }</h4>
                      <p className="text-gray-600 font-medium text-xs pb-3">{ member.possition }</p>
                    </div>
                  </div>
                </div>
              ) ) }
          </div>
          {/* Building Our Staff Section */ }
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2">Building Our Staff</h3>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 max-w-6xl mx-auto relative">
              {/* Stepper Line */ }
              <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-purple-600 z-0" style={ { marginLeft: '110px', marginRight: '110px' } }></div>
              {/* Leadership Team */ }
              <div className="flex flex-col items-center md:w-1/4 z-10">
                <div className="flex flex-col items-center justify-center bg-white rounded-full border-4 border-primary w-20 h-20 mb-2 shadow-md">
                  <FaBuilding className="text-primary text-3xl" />
                </div>
                <h4 className="font-semibold text-base mt-2 text-gray-800">Leadership Team</h4>
                <ul className="text-gray-600 text-xs mt-1 text-center">
                  <li>CEO</li>
                  <li>CFO</li>
                  <li>Program Director</li>
                  <li>Monitoring & Evaluation Manager</li>
                </ul>
              </div>
              {/* Support Staff */ }
              <div className="flex flex-col items-center md:w-1/4 z-10">
                <div className="flex flex-col items-center justify-center bg-white rounded-full border-4 border-secondary w-20 h-20 mb-2 shadow-md">
                  <FaUsers className="text-secondary text-3xl" />
                </div>
                <h4 className="font-semibold text-base mt-2 text-gray-800">Support Staff</h4>
                <ul className="text-gray-600 text-xs mt-1 text-center mb-6">
                  <li>Business Advisors</li>
                  <li>Training Coordinators</li>
                  <li>Mentors</li>
                </ul>
              </div>
              {/* Service Personnel */ }
              <div className="flex flex-col items-center md:w-1/4 z-10">
                <div className="flex flex-col items-center justify-center bg-white rounded-full border-4 border-cyan-600 w-20 h-20 mb-2 shadow-md">
                  <FaHandshake className="text-cyan-600 text-3xl" />
                </div>
                <h4 className="font-semibold text-base mt-2 text-gray-800">Service Personnel</h4>
                <ul className="text-gray-600 text-xs mt-1 text-center mb-8">
                  <li>Client Engagement Officers</li>
                  <li>Administrative Assistants</li>
                </ul>
              </div>
              {/* Field Teams */ }
              <div className="flex flex-col items-center md:w-1/4 z-10">
                <div className="flex flex-col items-center justify-center bg-white rounded-full border-4 border-purple-600 w-20 h-20 mb-2 shadow-md">
                  <FaGlobeAmericas className="text-purple-600 text-3xl" />
                </div>
                <h4 className="font-semibold text-base mt-2 text-gray-800">Field Teams</h4>
                <ul className="text-gray-600 text-xs mt-1 text-center mb-8">
                  <li>Outreach Officers stationed across all regions</li>
                  <li>Ensuring county-level engagement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Outcomes & Impact (CEEC) */ }
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">Economic Outcomes & Impact (CEEC)</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">The CEEC&apos;s work is measured by its influence on systemic empowerment, inclusive policy implementation, and improved citizen participation in economic activities. Key outcomes include:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Policy & Legislative Impact */ }
              <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col items-center border-t-4 border-primary hover:shadow-xl transition-shadow duration-300">
                <FaLandmark className="text-primary text-4xl mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-gray-800 text-center">Policy & Legislative Impact</h3>
                <div className="flex flex-col gap-4 w-full text-gray-600 text-sm mt-2">
                  <div>Successful development and rollout of the Citizen Economic Empowerment Act (CEEA), reserving tenders of up to E10 million for Swazi-owned businesses</div>
                  <div>Establishment of regulatory mechanisms to curb fronting and ensure genuine citizen ownership in public procurement</div>
                </div>
              </div>
              {/* Enterprise & Participation Impact */ }
              <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col items-center border-t-4 border-secondary hover:shadow-xl transition-shadow duration-300">
                <FaHouseUser className="text-secondary text-4xl mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-gray-800 text-center">Enterprise & Participation Impact</h3>
                <div className="flex flex-col gap-4 w-full text-gray-600 text-sm mt-2">
                  <div>CEEC has influenced the profiling and tracking of over 5,000 MSMEs through the MSME Registry, used to guide empowerment strategy</div>
                  <div>Growth in citizen participation in government procurement and local value chains through CEEC-mandated oversight</div>
                </div>
              </div>
              {/* Institutional Strengthening */ }
              <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col items-center border-t-4 border-cyan-600 hover:shadow-xl transition-shadow duration-300">
                <FaHandshake className="text-cyan-600 text-4xl mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-gray-800 text-center">Institutional Strengthening</h3>
                <div className="flex flex-col gap-4 w-full text-gray-600 text-sm mt-2">
                  <div>Built partnerships with UNDP, Business Eswatini, ENYC, and other agencies to deliver capacity building, compliance awareness, and policy dissemination</div>
                  <div>Integration of CEEC guidelines into procurement processes across ministries and local government units</div>
                </div>
              </div>
              {/* Inclusive Growth Outcomes */ }
              <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col items-center border-t-4 border-purple-600 hover:shadow-xl transition-shadow duration-300">
                <FaUsers className="text-purple-600 text-4xl mb-4" />
                <h3 className="font-semibold text-lg mb-3 text-gray-800 text-center">Inclusive Growth Outcomes</h3>
                <div className="flex flex-col gap-4 w-full text-gray-600 text-sm mt-2">
                  <div>Targeted inclusion of youth, women, persons with disabilities, and rural entrepreneurs in empowerment planning</div>
                  <div>Improved coordination among stakeholders to deliver training, policy awareness, and strategic enterprise registration</div>
                  <div>Laid a foundation for data-driven empowerment policy, based on disaggregated demographic and geographic analysis</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div>
        <Subscribe />
      </div>
      <Partners />
    </>
  )
}

export default Page