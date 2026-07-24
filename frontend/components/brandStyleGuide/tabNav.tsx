'use client'
import { useBrandStyle } from '@/contexts/brandStyleContext/brandStyleContext'
import React from 'react'

const navItems = [
    {
        "name":"COLORS",
    },
        {
        "name":"TYPOGRAPHY",
    },
        {
        "name":"BUTTONS",
    },
        {
        "name":"INPUTS",
    },
        {
        "name":"BADGES",
    },
        {
        "name":"CARD",
    },
        {
        "name":"LOADER",
    },    {
        "name":"TOKENS",
    },
    {
        "name":"ACCESSIBILITY"
    },
    {
        "name": "LOGOS AND ICONS"
    }
]

export default function TabNav() {
    const {activeTab, setActiveTab} = useBrandStyle()
  return (
    <nav className='flex flex-row gap-4 items-center mt-8 border-b-2 border-border pb-12 flex-wrap'>
        {
            navItems.map((item)=>(
                <button 
                key={item.name}
                className={activeTab===item.name.toLowerCase() ? 
                "text-primary bg-primary/15 rounded-sm p-2 transition duration-900 ease-in-out transition duration-900 ease-in-out":""}
                onClick={()=>setActiveTab((item.name.toLowerCase()))}
                >
                    {item.name}
                </button>
            ))
        }
    </nav>
  )
}
