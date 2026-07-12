'use client'

import { useHdf5Data } from '@/contexts/Hdf5DataContext'
import React, { useEffect, useState } from 'react'
import { workspaceService } from '@/services/workspaceServices'
import { Workspace } from '@/types/workspace'
import Sidebar from '@/components/dashboard/Sidebar'
import { Badge, Button, Card, CardContent, CardHeader, Loader } from '@/components/ui'
import { UploadRecord } from '@/types/hdf5'
import { PlusCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import UploadPage from '../upload/page'

export default function WorkspacePage() {
    const {currentWorkspaceId} = useHdf5Data()
    const [isLoading, setIsLoading] = useState(true)
    console.log(currentWorkspaceId)
    const [data, setData] = useState<Workspace>()
    const [uploads,setUploads] = useState<UploadRecord[]>()
    const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);

    const fetchWorkspace = async ()=>{
        const workspaceData = await workspaceService.getWorkspace(currentWorkspaceId)
        if(workspaceData.success){
            setData(workspaceData.workspace)
            setIsLoading(false)
        }
        console.log(workspaceData);
    }

    const fetchWorspaceUploads = async ()=>{
        const uploads = await workspaceService.getWorkspaceUploads(currentWorkspaceId)
        if(uploads.success){
            console.log(uploads)
            setUploads(uploads.uploads)            
        }
    }
    
    

    useEffect(() => {   
        if (currentWorkspaceId) {
            fetchWorkspace()
            fetchWorspaceUploads()
        }
    }, [currentWorkspaceId])

  return (
    <div className='size-full flex h-screen bg-background text-foreground'>
        <Sidebar/>
        <Modal open={fileUploadModalOpen} onClose={() => setFileUploadModalOpen(false)}>
            <UploadPage/>
        </Modal>
        <div className='flex justify-center'>
            {
                isLoading ? (<Loader/>): (
                <div className='p-16'>
                    <h1 className='font-bold'>{(data?.name).toUpperCase()}</h1>
                    <p>{data?.description}</p>
                    <Badge variant="success" className='mt-2'>{data?.status}</Badge>

                    <div className='mt-4 flex justify-between h-min'>
                        <h2>Workspace Uploads</h2>
                        <Button variant="outline" className='' size="sm" onClick={()=>{setFileUploadModalOpen(true)}}>Upload File</Button>
                    </div>
                        {(!uploads || uploads.length === 0) ? (
                            <div>
                            <p>Such empty. Upload a file to get started</p>
                            </div>
                        ) : (
                        uploads.map((upload, index) => (
                            <Card key={upload.id || index} className="upload-item w-[70vw] mt-4">
                                <CardHeader className='font-bold'>{upload.filename}</CardHeader>
                                <CardContent>{((upload.size_bytes)/(1024*1024)).toPrecision(2) } MB</CardContent>
                            </Card>

                        ))
                        )}
                </div>
                
                )
            }
        </div>

    </div>

  )
}
