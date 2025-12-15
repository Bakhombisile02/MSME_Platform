import React, { useEffect, useState } from 'react';
import { getRegisterUserList } from '../../api/user-lists';

const RegisteredUserList = () => {
  const [registeredUsersData, setRegisteredUsersData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalData, setTotalData] = useState(0);

  const limit = 10;
  const fetchRegisteredUsers = async (page, limit) => {
    try {
      const data = await getRegisterUserList(page, limit);
      setRegisteredUsersData(data?.values?.rows || []);
      setTotalPages(data?.total_pages || 1);
      setTotalData(data.total);
    } catch (err) {
      console.error("Error fetching Registered Users", err);
    }
  };

  const getFirstWords = (text, wordCount) => {
    if (!text) return "---";
    const words = text.split(" ");
    return words.slice(0, wordCount).join(" ") + (words.length > wordCount ? "..." : "");
  };

  useEffect(() => {
    fetchRegisteredUsers(page, limit);
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="bg-primary-950 shadow-xl shadow-black/15 font-semibold px-5 text-white py-4 text-start mb-6 flex justify-between items-center ">
          <span className="font-medium text-xl">Registered Users</span>
          <div className="text-sm">
            <span>{totalData} Entries Found</span>
          </div>
        </div>

        <div className="bg-white shadow-lg text-primary-950 overflow-x-auto text-sm ">
          <table className="w-full text-sm">
            <thead className="bg-primary-950/5">
              <tr className="text-left text-sm font-semibold text-primary-950 border-b border-primary-950/10">
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider">Full Name</th>
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider  sm:table-cell">Phone No</th>
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider  md:table-cell">Email</th>
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider">Region</th>
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider  lg:table-cell">Location</th>
                <th className="py-3 px-3 sm:px-4  text-left font-medium tracking-wider  lg:table-cell">Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-950/10">
              {registeredUsersData.length > 0 ? (
                registeredUsersData.map((user, index) => (
                  <tr 
                    key={index} 
                    onClick={() => {
                      setSelectedUser(user);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-primary-950/5 transition-colors"
                  >
                    <td className="py-3 px-3 sm:px-4 ">
                      <div className="font-medium">{user.name || "---"}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 sm:table-cell">{user.phone || "---"}</td>
                    <td className="py-3 px-3 sm:px-4 md:table-cell">
                      <div className="truncate max-w-[150px]">{user.email || "---"}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 ">{user.region || "---"}</td>
                    <td className="py-3 px-3 sm:px-4 lg:table-cell">{user.location_name || "---"}</td>
                    <td className="py-3 px-3 sm:px-4 lg:table-cell">
                      {getFirstWords(user.address, 5)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No registered users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[rgb(19,59,94)]">User Details</h2>
                <div className="w-12 h-1 bg-accent-500 mt-2 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Full Name</p>
                  <p className="text-primary-950 font-medium">{selectedUser.name || "---"}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Phone Number</p>
                  <p className="text-primary-950 font-medium">{selectedUser.phone || "---"}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Email</p>
                  <p className="text-primary-950 font-medium break-all">{selectedUser.email || "---"}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Region</p>
                  <p className="text-primary-950 font-medium">{selectedUser.region || "---"}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Location</p>
                  <p className="text-primary-950 font-medium">{selectedUser.location || "---"}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-500">Address</p>
                  <p className="text-primary-950 font-medium">{selectedUser.address || "---"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 px-2">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Previous
        </button>
        <span className="text-primary-950 font-medium">Page {page} of {totalPages}</span>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className="bg-primary-950 disabled:bg-gray-400 disabled:text-black/25 hover:bg-[#0f2d48] text-white px-4 py-2 rounded-md shadow"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default RegisteredUserList;