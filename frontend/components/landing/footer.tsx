import Image from 'next/image'
import React from 'react'
import UpLogo from '@/public/UPlogo-bg.png'
import BioPhysics from'@/public/biophysics_research_group.jpg'
import coretech from '@/public/coretech-logo.png'
export default function Footer() {
  return (
    <footer className='flex flex-row justify-space-between max-h-[20vh] mt-16'>
        <Image
        src={UpLogo}
        className='p-6 object-fit'
        />
        <Image
        src={BioPhysics}
        className='p-6 object-fit'
        />
        <Image
        src={coretech}
        className='object-cover'
        />

    </footer>
  )
}
