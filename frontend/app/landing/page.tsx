'use client'

import React from 'react'
import NavBar from '@/components/landing/navBar'
import Hero from '@/components/landing/hero'
import About from '@/components/landing/about'

export default function Landing() {
  return (
    <div>
        <NavBar/>
        <Hero/>
        <About/>
    </div>
  )
}
