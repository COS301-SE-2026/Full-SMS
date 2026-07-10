'use client';

import React, { useEffect, useState } from 'react';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';
import { getUserHdf5Uploads } from '@/services/hdf5services';
import { useAuth } from '@/contexts/authContext/AuthContext'; 
import { Card, CardContent, CardHeader, CardDescription, CardFooter, Button, CardTitle, Badge, Loader } from '../ui';
import { UploadRecord } from '@/types/hdf5';

export default function RecentUploads() {
  const auth = useAuth()
  const [userUploads, setUserUploads] = useState<{ data: UploadRecord[] }>({ data: [] });  
  const [isLoading, setIsLoading]= useState(true)

  console.log(auth.user)


  useEffect(()=>{
    const getUploads = async ()=>{
    const uploads = await getUserHdf5Uploads()
    if(uploads){
      setUserUploads(uploads)
      setIsLoading(false)
      console.log(uploads)
    }
    if(uploads?.data.length === 0){
      return console.error("User uploads not found")
    }
    }

    if(auth?.user){
      getUploads()
    }
    
  },[auth?.user])

    const getRelativeDaysAgo = (isoString: string): string => {
      const past = new Date(isoString);
      const now = new Date();
      
      const diffMs = past.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(diffDays, 'day');
    }

  return (
    <div className='flex flex-col justify-center'>
      <p className='font-base text-center text-border'>Your recent uploads</p>
      {
        isLoading ? (<Loader/>) :(
          userUploads.data?.slice(0,5).map((upload) => (
          <Card key={upload.id} className='mb-2 border border-primary outline'>
              <CardHeader>
                <CardTitle>{upload.filename}</CardTitle>
                <CardDescription className='flex flex-row justify-items-end-safe'>
                  <span className='mr-4'>{(upload.size_bytes/(1024*1024)).toFixed(1)} MB</span>
                  <span>Uploaded {getRelativeDaysAgo(upload.created_at)}</span>
                </CardDescription>
              </CardHeader>
          </Card>
      ))
        )
      }

    </div>

  );
}
