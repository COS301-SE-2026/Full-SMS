"use client"

import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/Card"
import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
                            <CardTitle>1. Will I lose my analysis if I close the browser without saving?</CardTitle>
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
                            <p>Yes, you will lose your analysis if you close the browser without saving.
                                Always save your session so you can retrieve it in the sessions list when you get back on the platform.
                            </p>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>2. Do I need to know Python to write a plugin?</CardTitle>
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
                            <p>Yes and you have to follow the script provided so that your plugin is valid and gets added to your analysis hub in the plugins section.</p>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>3. I forgot my password, how do I reset it?</CardTitle>
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
                            <p>Go to your Account page. There will be a Password section and a Change button. 
                                Click that button and complete the necessary steps in order to reset your password.</p>
                        </CardContent>
                    )}
                </Card>

                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between bg-primary/10">
                        <div>
                            <CardTitle>4. How do I load my previous sessions?</CardTitle>
                        </div>
                        <Button variant="secondary" size="sm"
                            onClick={() => {
                                if (openQuestion === 3) {setOpenQuestion(null)}
                                else {setOpenQuestion(3)}
                            }}
                            className={`transition-transform duration-300 ${openQuestion === 3 ? "rotate-180" : ""}`}>
                            <ChevronDown />
                        </Button>
                    </CardHeader>

                    {openQuestion === 3 && (
                        <CardContent>
                            <p>Click the Sessions button. It will show all the sessions you have saved and can be loaded.</p>
                        </CardContent>
                    )}
                </Card>

                </div>
                
            </section>
        </main>
    )
}