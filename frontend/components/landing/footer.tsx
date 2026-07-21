import Image from 'next/image'
import React from 'react'
import UpLogo from '@/public/UPlogo-No-bg.png'
import BioPhysics_No_Bg from '@/public/biophysicsNo_bg.png'
import coretech from '@/public/coretech-logo.png'
export default function Footer() {
  return (
    <footer className='flex flex-row justify-space-between max-h-[20vh] mt-16'>
        <Image
        src={UpLogo}
        alt='university of pretoria logo.'
        className='p-6 object-fit'
        />
        <Image
        src={BioPhysics_No_Bg}
        alt='University of Pretoria Biophysics research group logo.'
        className='object-fit'
        />
        <Image
        src={coretech}
        alt='Team coretech logo.'
        className='object-cover'
        />

    </footer>
  )
}
