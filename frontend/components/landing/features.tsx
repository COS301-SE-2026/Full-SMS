import React from 'react'
import { Cloud, File, Unplug } from 'lucide-react'
import { Card } from '../ui'

export default function Features() {
  return (
    <div className=''>
        <div
            className="mx-auto flexflex-row max-w-7xl px-4 sm:px-6 lg:px-8 py-12"
        >
          <h2 className='font-mono text-6xl text-left'>Features:</h2>
          <div className='flex flex-row '>
            <Card className='flex flex-row w-[50vw] m-4'>
              <Cloud
                size={72}
              />
              <div className='flex flex-col'>
                <h3 className='flex justify-center text-3xl'>Cloud Native Data Processing</h3>
                <p>Ditch the local scripts and outdated desktop plugins. 
                  Upload your raw microscope traces to a secure, browser-based suite 
                  and run complex computational analysis from any device, without taxing your local hardware.</p>
              </div>
            </Card>
            <Card className='flex flex-row justify-end m-4'>
              <h3 className='text-3xl'>Native Hdf5/h5 handling</h3>
              <File
                size={72}
              />
            </Card>
            <Card className='flex flex-row m-4'>
              <Unplug
                size={72}
              />
              <h3 className='text-3xl'>
                Custom Plugins
              </h3>
            </Card>
          </div>
      </div>

    </div>
  )
}
