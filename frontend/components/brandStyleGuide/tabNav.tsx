'use client'
import { useBrandStyle } from '@/contexts/brandStyleContext/brandStyleContext'
import React from 'react'

export default function TabNav() {
    const {activeTab, setActiveTab} = useBrandStyle()
  return (
    <nav className='flex flex-row gap-4 items-center mt-8'>
        <button 
        className={activeTab==='colors' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('colors')}
        >
            COLORS
        </button>
        <button 
        className={activeTab==='typography' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('typography')}>
            TYPOGRAPHY
        </button>
        <button 
        className={activeTab==='buttons' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('buttons')}
        >
            BUTTONS
        </button>
        <button 
        className={activeTab==='inputs' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('inputs')}
        >
            INPUTS
        </button>
        <button 
        className={activeTab==='badges' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('badges')}
        >
            BADGES
        </button>
        <button 
        className={activeTab==='card' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('card')}
        >
            CARD
        </button>
        <button 
        className={activeTab==='loader' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('loader')}
        >
            LOADER
        </button>
        <button 
        className={activeTab==='tokens' ? 
        "text-primary bg-primary/50 rounded-sm p-2 transition duration-900 ease-in-out":""}
        onClick={()=>setActiveTab('tokens')}
        >
            TOKENS
        </button>
    </nav>
  )
}
