'use client'

import { useState } from 'react'
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-2 sm:px-4 lg:px-6">
            <a className="block text-teal-600 text-xl dark:text-teal-300" href="#">
                <span className='font-mono'>Full SMS</span>
            </a>

            <div className="flex flex-1 items-center justify-end md:justify-between">
            <nav aria-label="Global" className="hidden md:block">
                <ul className="flex items-center gap-6 text-sm">
                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    About
                    </a>
                </li>

                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    Careers
                    </a>
                </li>

                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    History
                    </a>
                </li>

                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    Services
                    </a>
                </li>

                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    Projects
                    </a>
                </li>

                <li>
                    <a
                    className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                    href="#"
                    >
                    Blog
                    </a>
                </li>
                </ul>
            </nav>

            <div className="flex items-center gap-4">
                <div className="sm:flex sm:gap-4">
                <a
                    className="block rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 dark:hover:bg-teal-500"
                    href="#"
                >
                    Login
                </a>

                <a
                    className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 transition hover:text-teal-600/75 sm:block dark:bg-gray-800 dark:text-white dark:hover:text-white/75"
                    href="#"
                >
                    Register
                </a>
                </div>

                <button
                className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden dark:bg-gray-800 dark:text-white dark:hover:text-white/75"
                >
                <span className="sr-only">Toggle menu</span>
                <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                </button>
            </div>
            </div>
        </div>
    </header>
  )
}
