import React from 'react'
import RasterToolbar from './raster-toolbar'
import { RasterHeatmap } from './rater-heatmap'

export default function RasterTab() {
  return (
    <div className='h-full w-full'>
        <RasterToolbar/>
        <RasterHeatmap/>
    </div>
  )
}
