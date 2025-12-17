import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiMenu, FiX, FiMap, FiBox, FiBarChart2, FiLogOut, FiHeadphones } from 'react-icons/fi'
import { TbCategoryPlus } from "react-icons/tb";
import { MdOutlineQuestionAnswer, MdOutlineFeedback, MdOutlineNotifications, MdOutlineBusinessCenter, MdHomeRepairService, MdOutlineHomeRepairService, MdOutlineMiscellaneousServices, MdAttachEmail } from "react-icons/md";
import { IoIosContacts } from "react-icons/io";
import { signout } from '../../../api/auth-user';
import { FaCloudDownloadAlt, FaImage, FaUserFriends } from "react-icons/fa";
import { PiArticleNyTimes, PiMicrosoftTeamsLogoFill } from "react-icons/pi";
import { AiFillTwitch } from 'react-icons/ai';
import { IoBusiness } from 'react-icons/io5';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation();
  const currentPath = location.pathname;

  const handleSignout = () => {
    signout(() => {
      window.location.href = "/login";
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      }
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }

    handleResize()  
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)

  // Check if current path starts with /helpdesk or /ticket
  const isHelpDeskActive = currentPath.startsWith('/helpdesk') || currentPath.startsWith('/ticket');

  return (
    <>
      {/* Navbar */}
      {isMobile && (
        <div className="fixed top-0 left-0 h-16 right-0 bg-[#2E458D] text-white z-50">
          <div className="flex justify-between items-center py-5 p-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <button onClick={toggleSidebar} className="md:hidden">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isOpen ? '-translate-x-2' : '-translate-x-80 md:translate-x-0'}
        w-72 bg-white text-[#2E458D] h-screen fixed z-50 
        transition-transform duration-300 ease-in-out flex flex-col
        border-r border-gray-200
      `}>
        <img
          src="/assets/logo_msme.png"
          alt="Logo"
          className="w-40 h-40 my-5 mb-5 rounded-full mx-auto"
        />
        <div className=" flex flex-col items-center pb-5 text-center font-medium text-lg px-4">
          MSME CMS
        <span className='border-[1px] w-full mt-2 border-black/15'/>
        </div>
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-4">
          {[
            { to: "/", label: "Dashboard", icon: <FaImage size={20} /> },
            { to: "/banner", label: "Banners", icon: <AiFillTwitch  size={18} /> },
            { to: "/business-category", label: "Business Categories", icon: <MdOutlineBusinessCenter  size={20} /> },
            { to: "/business-sub-category", label: "Business Sub-Categories", icon: <TbCategoryPlus size={20} /> },
            { to: "/partners", label: "Partners", icon: <FaUserFriends  size={20} /> },
            { to: "/articles", label: "Articles", icon: <PiArticleNyTimes size={20} /> },
            { to: "/helpdesk", label: "Help Desk", icon: <FiHeadphones size={20} />, isActive: isHelpDeskActive },
            { to: "/team-member", label: "Team Members", icon: <PiMicrosoftTeamsLogoFill  size={20} /> },
            { to: "/msme-business/0", label: "MSME Businesses", icon: <IoBusiness   size={20} /> },
            { to: "/msme-by-category", label: "MSME By Categories", icon: <FiBarChart2 size={20} /> },
            { to: "/download-new", label: "Updates and Downloads", icon: <FaCloudDownloadAlt   size={20} /> }, 
            { to: "/service-category", label: "Service Provider Categories", icon: <MdOutlineHomeRepairService    size={20} /> },
            { to: "/service-provider", label: "Service Providers", icon: <MdOutlineMiscellaneousServices    size={20} /> },
            { to: "/service-provider-by-category", label: "Service Providers By Categories", icon: <MdOutlineHomeRepairService size={20} /> },
            { to: "/faq", label: "FAQs", icon: <MdOutlineQuestionAnswer size={20} /> },
            { to: "/feedback-received", label: "Feedback Received", icon: <MdOutlineFeedback size={20} /> },
            { to: "/subscriber", label: "Subscribers", icon: <MdAttachEmail  size={20} /> },
          ].map(({ to, label, icon, isActive }) => (
            <Link
              key={to}
              to={to}
              onClick={isMobile ? toggleSidebar : undefined}
              className={`flex items-center gap-3 p-3 mb-2 transition-colors rounded-lg
                ${(isActive !== undefined ? isActive : currentPath === to) ? 'bg-[#2E458D] text-white' : 'hover:bg-[#2E458D]/10 text-[#2E458D]'}
              `}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}

          <button
            onClick={handleSignout}
            className="flex items-center gap-3 p-3 mt-4 rounded-lg hover:bg-[#2E458D]/10 text-[#2E458D] w-full"
          >
            <FiLogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  )
}

export default Sidebar