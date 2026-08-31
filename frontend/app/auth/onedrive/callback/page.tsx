'use client'

import { Loader } from '@/components/ui';
import { OneDriveAuthService } from '@/services/authServices';
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'
import { useToast } from '@/contexts/toastContext/ToastContext';
import { useAuth } from '@/contexts/authContext/AuthContext';

export default function OneDriveAuthCallback() {
    const {errorToast} = useToast()
    const {oneDriveLinked, setOneDriveLinked} = useAuth()
    const sParams = useSearchParams()
    const code = sParams.get('code')
    const calledService = useRef(false)

    useEffect(()=>{
        const callService = async()=>{
            if(code && !calledService.current){
                calledService.current=true
                try{
                    await OneDriveAuthService(code)
                    setOneDriveLinked(true)
                    console.log("Successfully Signed into OneDrive")
                    console.log("One drive linked bool:", oneDriveLinked)
                    // window.close()
                }
                catch(error){
                    errorToast("Failed to sign into OneDrive")
                    console.error('Failed to link OneDrive', error);
                }
            }
        }
        callService()
    }, [code])

    // window.close()
  return (
    <div>
        <Loader size='lg' centered/>
    </div>
  )
}
