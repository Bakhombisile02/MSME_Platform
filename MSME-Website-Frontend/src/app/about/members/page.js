"use client";
import { getTeamMembersList } from '@/apis/lists-api';
import Partners from '@/components/Partners';
import Subscribe from '@/components/Subscribe';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

 const TeamMembers = () => {

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
      <div className='max-w-5xl m-auto'>
        <div className="text-center py-12">
            <h2 className="text-sm uppercase  font-semibold text-gray-500">Our Team</h2>
            <h3 className="text-3xl font-bold py-5 text-black/80">Meet Our Leadership Team</h3>
        </div>
        <div className="grid grid-cols-4  justify-around gap-5 items-center m-auto px-4 py-8  mx-auto">
            {/* Team Member Card */ }
            { loading ? (
                <div className="flex col-span-4 justify-center items-center w-full  m-auto h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : 
                teamMembers.map( ( member ) => (
                <div
                    key={ member.id }
                    className="bg-white flex rounded flex-col m-auto shadow-md  w-[210px] text-center"
                >
                    <Image
                    src={ `${process.env.NEXT_PUBLIC_API_IMG_BASE_URL}/${member.url}` }
                    alt={ member.name }
                    width={ 220 }
                    height={ 200 }
                    className=" w-full h-60 rounded-t  object-cover mb-4"
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
      </div>
      <div className='mt-10'>
        <Subscribe />
        <Partners />
      </div>
    </>
  )
}

export default TeamMembers