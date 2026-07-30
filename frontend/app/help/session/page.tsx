"use client"

import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/Card"
import { MenuBar } from "@/components/analysisHub/menu-bar"
import { useState } from "react";
import { ChevronDown, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui";

export default function FAQPage(){
    const [openQuestion, setOpenQuestion] = useState<number | null>(0)
    return(
        <main>
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

            <section className="px-4 mx-auto max-w-3xl py-2">
                <div className="space-y-4">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle >1. How to save a session</CardTitle>
                        </div>
                        <Button variant="secondary" size="sm"
                            onClick={() => {
                                if (openQuestion === 0) {setOpenQuestion(null)}
                                else {setOpenQuestion(0)}
                            }}
                            className={`transition-transform duration-300 ${openQuestion === 0 ? "rotate-180" : ""}`}>
                            <ChevronDown />
                        </Button>
                    </CardHeader>

                    {openQuestion === 0 && (
                        <CardContent>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>
                                    Visit the Analysis Hub page</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select relevant tabs and parameters for your session</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Click the Save button on the menu bar</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Write your sessions name and click Save</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>2. How to load a saved session</CardTitle>
                        </div>
                        <Button variant="secondary" size="sm"
                            onClick={() => {
                                if (openQuestion === 1) {setOpenQuestion(null)}
                                else {setOpenQuestion(1)}
                            }}
                            className={`transition-transform duration-300 ${openQuestion === 1 ? "rotate-180" : ""}`}>
                            <ChevronDown />
                        </Button>
                    </CardHeader>

                    {openQuestion === 1 && (
                        <CardContent>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Visit the Analysis Hub page</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Click the Sessions button on the menu bar</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select your desired session in the Recent sessions list</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>3. What gets saved in a session</CardTitle>
                        </div>
                        <Button variant="secondary" size="sm"
                            onClick={() => {
                                if (openQuestion === 2) {setOpenQuestion(null)}
                                else {setOpenQuestion(2)}
                            }}
                            className={`transition-transform duration-300 ${openQuestion === 2 ? "rotate-180" : ""}`}>
                            <ChevronDown />
                        </Button>
                    </CardHeader>

                    {openQuestion === 2 && (
                        <CardContent>
                            <ul className="space-y-2 list-none pl-0">
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Uploaded files to avoid re-uploading when loading a session</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Chosen measurements and other measurement-specific settings</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Current analysis parameters and other updated settings</li>
                            <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Current analysis tab so it opens when you load a session</li>
                            <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Applied filters, groupings, analysis results you have generated</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>
                </div>
                
            </section>
        </main>
    )
}