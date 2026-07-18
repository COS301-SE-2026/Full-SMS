"use client"

import {MenuBar} from '@/components/analysisHub/menu-bar';
import {Sidebar} from '@/components/analysisHub/sidebar';
import {IntensityChart} from '@/components/analysisHub/intensity-tab/intensity-chart';
import {StatusBar} from '@/components/analysisHub/status-bar';
import { AnalysisToolbar } from '@/components/analysisHub/intensity-tab/analysis-toolbar';
import { useState} from 'react';
import { Modal } from '@/components/ui/Modal';
import UploadPage from '../upload/page';
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext';
import GroupingTab from '@/components/analysisHub/grouping-tab/grouping-tab';
import RasterTab from '@/components/analysisHub/raster-tab/raster-tab';
import SpectraMap from '@/components/analysisHub/spectra-tab/spectra-map';
import FittingDialog from '@/components/analysisHub/lifetime-tab/fitting-dialog';
import LifetimeTab from '@/components/analysisHub/lifetime-tab/lifetime-tab';


export default function App() {
    const [fileUploadModalOpen, setFileUploadModalOpen] = useState<boolean>(false)
    const {activeTab, fittingDialogOpen, setFittingDialogOpen} = useAnalysisTab()

  return (
    <div className="size-full flex flex-col bg-background text-foreground h-screen">
      <MenuBar onOpenFileUpload={() => setFileUploadModalOpen(true)} />
      <Modal open={fileUploadModalOpen} onClose={() => setFileUploadModalOpen(false)}>
        <UploadPage/>
      </Modal>
      <Modal open={fittingDialogOpen} onClose={() => setFittingDialogOpen(false)}>
        <FittingDialog/>
      </Modal>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        {activeTab==="intensity" && (<div className="flex flex-col flex-1 min-w-0">
          <AnalysisToolbar />
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <IntensityChart />
          </div>
        </div>)}
        {
          activeTab==="grouping" &&(<div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <GroupingTab />
          </div>
        </div>)}
        {
          activeTab==="raster" &&(<div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <RasterTab />
          </div>
        </div>)}
        {
          activeTab==="spectra" &&(<div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <SpectraMap />
          </div>
        </div>)}
          {
          activeTab==="lifetime" &&(<div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <LifetimeTab />
          </div>
        </div>)}     
      </div>
      <StatusBar />
    </div>
  );
}
