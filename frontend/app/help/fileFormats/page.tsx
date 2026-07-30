"use client"

import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/Card"
import { useState } from "react";
import { ChevronDown, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui";
import HelpHero from "@/components/help/HelpHero";
export default function FAQPage(){
    const [openQuestion, setOpenQuestion] = useState<number | null>(0)
    return(
        <main>
            <HelpHero />
            <section className="px-4 mx-auto max-w-3xl py-2">
                <div className="space-y-4">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle >1. What files are supported?</CardTitle>
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
                                    Hdf5</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Pt3</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Csv</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>H5</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>2. How can these files be used for an analysis session?</CardTitle>
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
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>You can upload your valid spectroscopy file in the File Upload Page.</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>Your file must be up to 500mb</li>
                                <li className="flex items-start gap-2">
                                    <CircleCheckBig className="w-4 h-4 text-primary mt-0.5 shrink-0"/>After uploading your file, you can navigate to the Analysis Hub page to perform an analysis</li>
                            </ul>
                        </CardContent>
                    )}
                </Card>
                </div>
                
            </section>
        </main>
    )
}