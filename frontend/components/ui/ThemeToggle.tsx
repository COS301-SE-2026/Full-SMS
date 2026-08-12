import React, { useEffect, useState } from 'react'
import { Button } from './Button';
import { Sun } from 'lucide-react';

interface ThemeProps {
  type?: "button" | "icon" 
}
export default function ThemeToggle({type}:ThemeProps) {
    const [lightMode, setLightMode] = useState(false);

    useEffect(()=>{
        const currentTheme = localStorage.getItem('theme');
        if(currentTheme === 'light-mode'){
            document.documentElement.classList.add('light')
            setLightMode(true);
        }
    },[])

    const toggleTheme = () => {
    if (lightMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setLightMode(false);
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setLightMode(true);
    }
  };
  return (
    (type==="button" ? <Button onClick={toggleTheme} variant='ghost' className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors" type='button'>
     Theme
    </Button> : <Button onClick={toggleTheme} variant='ghost' className="p-2" type='button' leftIcon={<Sun/>}>
      
    </Button>)
  )
  
}
