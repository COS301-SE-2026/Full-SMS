import React, { useEffect } from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { getLifetimeData } from '@/services/analysisServices'
import LifetimeCharts from './lifetime-charts'

export default function LifetimeTab() {


  return (
    <div className='w-full h-full'>
        <LifetimeToolbar/>
        <LifetimeCharts/>
    </div>
  )
}
