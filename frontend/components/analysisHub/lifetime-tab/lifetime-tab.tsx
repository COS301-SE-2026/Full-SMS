import React from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import LifetimeCharts from './lifetime-charts'

export default function LifetimeTab() {


  return (
    <div className='w-full h-full'>
        <LifetimeToolbar/>
        <LifetimeCharts/>
    </div>
  )
}
