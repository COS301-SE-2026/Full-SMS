'use client'

import { Loader } from '@/components/ui';
import { OneDriveAuthService } from '@/services/authServices';
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

export default function OneDriveAuthCallback() {
    const router = useRouter();
    const sParams = useSearchParams()
    const code = sParams.get('code')
    useEffect(()=>{
        if (code){
            OneDriveAuthService
        }
    },[code, router])
    window.close()
  return (
    <div>
        <Loader size='lg' centered/>
    </div>
  )
}
