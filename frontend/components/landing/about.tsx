import Image from 'next/image'
import React from 'react'
import HubScreenshot from '@/public/analysisHub_screenshot.png'

export default function About() {
  return (
    <section className="relative overflow-hidden">
        <div
            className="mx-auto flex flex-row max-w-7xl items-center px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className='flex flex-col lg:w-[45%] lg:pr-8'>
            <h2 className='text-6xl font-mono'>What is Full SMS?</h2>
            <div className='flex flex-row'>
              <p className='mt-8 md:text-lg text-left z-10'>
                Full SMS is a comprehensive Single Molecule Spectroscopy (SMS) analysis suite. It analyzes fluorescence measurements from HDF5 files, 
                performing change point analysis, hierarchical clustering, lifetime fitting, and correlation functions.
              </p>
            </div>
          </div>
            <Image
              src={HubScreenshot}
              alt='Screenshot of the Full SMS analysis hub'
              className='absolute hidden lg:block lg:left-[60%] xl:left-[55%] w-[80vw] max-w-[1100px] mx-auto border border-border rounded-lg mt-50'
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
        </div>
    </section>
  )
}
