'use client'

import React from 'react'
import NavBar from '@/components/landing/navBar'
import Hero from '@/components/landing/hero'
import About from '@/components/landing/about'
import Features from '@/components/landing/features'
import { Particles } from '@/components/landing/particles'
import Footer from '@/components/landing/footer'

export default function Landing() {
  return (
    <Particles className='scroll-smooth'>
        <NavBar/>
        <Hero/>
        <About/>
        <Features/>
        <Footer/>
    </Particles>
  )
}
