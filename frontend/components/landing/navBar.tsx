'use client'

import { useState } from 'react'
import { Button } from '../ui'
import Link from 'next/link'
import { useAuth } from '@/contexts/authContext/AuthContext'

export default function NavBar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const {user} = useAuth();
  return (
    <header className="z-100 ">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-2 sm:px-4 lg:px-6">
            <Link className="block text-primary text-xl dark:text-primary hover:animate-pulse" href="#">
                <span className='hover:animate-bounce font-mono font-bold text-3xl '>Full SMS</span>
            </Link>

            <div className="flex flex-1 items-center justify-end md:justify-between">
            <nav aria-label="Global" className="hidden md:block text-xl">
                <ul className="flex items-center gap-6">
                <li>
                    <Link
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#about"
                    >
                    About
                    </Link>
                </li>

                <li>
                    <Link
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#features"
                    >
                    Features
                    </Link>
                </li>

                {/* <li>
                    <Link
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    Documentation
                    </Link>
                </li> */}

                <li>
                    <Link
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="https://github.com/COS301-SE-2026/Full-SMS"
                    target="_blank" rel="noopener noreferrer"
                    >
                    Github
                    </Link>
                </li>
                </ul>
            </nav>

            <div className="flex items-center gap-4 z-10">
                {!user ? (<div className="sm:flex sm:gap-4">
                    <Link href="/login">
                        <Button variant="outline" className='mr-2'>
                            Login
                        </Button>
                    </Link>
                    <Link href='/register'>
                        <Button variant="primary">
                            Sign Up
                        </Button>
                    </Link>
                </div>) : (
                    <Link href="/dashboard">
                        <Button variant="outline">Dashboard</Button>
                    </Link>
                )}

            </div>
            </div>
        </div>
    </header>
  )
}
