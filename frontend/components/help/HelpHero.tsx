"use client"

import { MenuBar } from "@/components/analysisHub/menu-bar"

export default function HelpHero(){
    return(
        <>
            <MenuBar  onOpenFileUpload={()=>{}}/> 
            <div className="flex flex-col items-center justify-center text-center py-24">
                <span className="text-sm uppercase tracking-wide block text-primary/70">
                    FULL SMS Guide
                </span>
                <h1 className="text-primary text-4xl md:text-6xl font-bold">How can we help you?</h1>
                <div className="flex flex-row items-center justify-center text-center gap-1">
                    <p className="text-foreground/60">Learn the basics of FULLSMS, saving a session, exporting files, adding your plugin algorithms and more.</p>
                </div>
            </div>
        </>
            )
            }