import React from 'react'
import HeroImage from '@/public/heroImage2.svg'
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="bg-background lg:grid lg:h-screen lg:place-content-center">
        <div
            className="mx-auto w-screen max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:grid md:grid-cols-2 md:items-center md:gap-4 lg:px-8 lg:py-32"
        >
            <div className="max-w-prose text-left">
            <h1 className="text-4xl font-bold sm:text-5xl">
               Single-Molecule Analysis, 
               <strong className="text-bold text-primary/70"> Unchained </strong> 
               from the Desktop.
            </h1>

            <p className="mt-4 text-base text-pretty sm:text-lg/relaxed">
                Stop wrestling with local scripts and outdated plugins.
                Upload your traces directly from the microscope to a secure, browser-based suite built for modern biophysics teams.
            </p>
            </div>
            <div className='mx-auto'>
                <Image src={HeroImage} alt="vector image of a scientist looking through a microscope " />
            </div>
        </div>
    </section>
  )
}
