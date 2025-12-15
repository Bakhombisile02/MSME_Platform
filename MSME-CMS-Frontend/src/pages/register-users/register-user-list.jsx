import React from 'react'
import RegisteredUserList from '../../components/registered-users/registered-user';

const RegisterUser= () => {
  return (
    <>
     <div className="p-6 px-10 min-h-screen">
      <div className="text-sm text-gray-500 pb-5">
        Pages / <span className="text-gray-800">Registered Users</span>
      </div>
        <RegisteredUserList/>
      </div>
    </>
  )
}

export default RegisterUser;