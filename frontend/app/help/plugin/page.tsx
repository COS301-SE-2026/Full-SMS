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
                            <CardTitle >1. How to add a plugin</CardTitle>
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
                                    Sign up to create your FULLSMS account</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Login to your new account</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>You will be led to the dashboard page where you can create a workspace, visit your profile or create a plugin</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select the Plugins option on the side menu</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Click the New Plugin button</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Write the name of your Plugin and it is description</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Write the script of your plugin algorithm following the format provided</li>
                                 <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select the Configuration option next to Code </li>
                                 <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Add parameter and output types</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Click the Create Plugin button to create your plugin</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>2. How to use a plugin for your analysis</CardTitle>
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
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Your new plugin will appear on the Plugins page</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select the 3 dots on the Actions column to delete, disable or edit your plugin</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select the Workspaces page and your workspace</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Select the file you uploaded</li>
                                 <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Visit the Analysis Hub page and select the plugin you would like to use on the side menu with a list of plugins</li>
                                 <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Adjust relevant parameters and analyse your data</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>3. Format of your Python script
                            </CardTitle>
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
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Your algorithm must be a function named run(data, params)</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>data as a parameter provides microtimes, abstimes, channel, metadata. Use only what is needed.</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>params holds user settings</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Docstring must document the expected data or params fields and return shape</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Handle edge cases such as empty data without crashing</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Imports can live inside the function</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>The function returns a dictionary of output IDs mapped to result data</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>The function converts NumPy to plain lists/values before returning</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Include display meetadata so results can auto-render as charts</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>
                </div>
                
            </section>
        </main>
    )
}