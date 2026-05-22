"use client"

import {MenuBar} from '@/components/analysisHub/menu-bar';
import {Sidebar} from '@/components/analysisHub/sidebar';
import {PhotonChart} from '@/components/analysisHub/photon-chart';
import {IntensityHistogram} from '@/components/analysisHub/intensity-histogram';
import {StatusBar} from '@/components/analysisHub/status-bar';
import { AnalysisToolbar } from '@/components/analysisHub/analysis-toolbar';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import UploadPage from '../upload/page';

export default function App() {
    const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  return (
    <div className="size-full flex flex-col bg-background text-foreground h-screen">
      <MenuBar onOpenFileUpload={() => setFileUploadModalOpen(true)} />
      <Modal open={fileUploadModalOpen} onClose={() => setFileUploadModalOpen(false)}>
        <UploadPage/>
      </Modal>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AnalysisToolbar />
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <PhotonChart />
            <IntensityHistogram />
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
