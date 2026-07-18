import React from 'react'

export default function About() {
  return (
    <section className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-2 sm:px-4 lg:px-6">
        <div
            className="mx-auto max-w-7xl px-4 flex flex-col h-fit justify-start"
        >
        <h2 className='text-6xl font-mono'>What is Full SMS?</h2>
        <p className='mt-8 md:text-lg text-left w-fit'>
          Full SMS was a DearPyGui-based GUI application for single-molecule spectroscopy (SMS) data analysis, 
          developed by the Biophysics Group at the University of Pretoria and later rewritten as a web application by Team Coretech. It analyzes fluorescence measurements from HDF5 files, 
          performing change point analysis, hierarchical clustering, lifetime fitting, and correlation functions.
        </p>
        </div>
        {/* <div className='w-[50vw]'>
          <h2>Features:</h2>
        </div> */}
    </section>
  )
}
