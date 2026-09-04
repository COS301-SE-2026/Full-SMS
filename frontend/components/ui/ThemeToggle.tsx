'use client'
import React, { ButtonHTMLAttributes, useEffect, useState } from "react";
import { Button } from "./Button";
import { Sun } from "lucide-react";

interface ThemeProps  extends ButtonHTMLAttributes<HTMLElement>{
  toggleType?: string;
}
export default function ThemeToggle({ toggleType }: ThemeProps) {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "light"
    }
    return false
  })

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light")
    } 
    else {
      document.documentElement.classList.remove("light")
    }
  }, [isLight])

  const toggleTheme = () => {
    setIsLight((prev) => {
      const nextTheme = !prev
      localStorage.setItem("theme", nextTheme ? "light" : "dark")
      return nextTheme
    })
  }
  return toggleType === "button" ? (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
      type="button"
    >
      Theme
    </Button>
  ) : (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      className="p-2"
      type="button"
      leftIcon={<Sun />}
    ></Button>
  );
}
