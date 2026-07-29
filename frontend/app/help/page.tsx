"use client"

import Link from "next/link";
import { Button } from "@/components/ui"
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/Card"
import { Rocket, ChartColumn, FileSearchCorner, Download, CircleQuestionMark, Save, RotateCcw, Puzzle, Mail } from "lucide-react"
import { MenuBar } from "@/components/analysisHub/menu-bar"

export default function HelpMenuPage(){
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6 max-w-7xl mx-auto pb-10">
                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Rocket /></div>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>Are you new to FullSMS? This is for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-none space-y-1">
                            <li className="flex items-center gap-1">How to create a workspace</li>
                            <li className="flex items-center gap-1">How to upload a file for analysis</li>
                            <li className="flex items-center gap-1">How to navigate the Analysis Hub page</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Save /></div>
                        <CardTitle>Saving and Loading a Session</CardTitle>
                        <CardDescription>Learn how to save and load a session.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>How to save a session</li>
                            <li>How to load a recent session</li>
                            <li>What gets saved in a session</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><ChartColumn /></div>
                        <CardTitle>Analysis Features</CardTitle>
                        <CardDescription>Learn what each analysis feature does</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>What Change Point Analysis does</li>
                            <li>What Clustering/Grouping does</li>
                            <li>How to adjust bin size and confidence</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><FileSearchCorner /></div>
                        <CardTitle>File formats</CardTitle>
                        <CardDescription>What file formats are supported</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>Supported file types</li>
                            <li>How they can be used</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Puzzle /></div>
                        <CardTitle>Plugin</CardTitle>
                        <CardDescription>Learn how to add a new analysis algorithm as a plugin</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>How to add a plugin</li>
                            <li>How to use it</li>
                            <li>Format of your Python script</li>
                        </ul>
                    </CardContent>
                </Card>

                  <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                       <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Download /></div>
                        <CardTitle>Export</CardTitle>
                        <CardDescription>Learn how to export</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>How to export results</li>
                            <li>Supported export formats</li>
                        </ul>
                    </CardContent>
                </Card>

                <Link href="/help/faqs" className="contents">
                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><CircleQuestionMark /></div>
                        <CardTitle>FAQs</CardTitle>
                        <CardDescription>Frequently asked questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>What is a plugin and how is it used?</li>
                            <li>Can I upload multiple files at once and have multiple simulations happening at the same time?</li>
                        </ul>
                    </CardContent>
                </Card>
                </Link>

                <Link href="/profile" className="contents">
                    <Card className="group hover:-translate-y-2 transition-transform duration-300">
                        <CardHeader>
                            <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><RotateCcw /></div>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Learn how to reset your password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul>
                                <li>How to reset your password</li>
                            </ul>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="group hover:-translate-y-2 transition-transform duration-300">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Mail /></div>
                        <CardTitle>Contact support</CardTitle>
                        <CardDescription>Reach out to the development team for additional help</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>Send us a detailed ticket and we will get back to you as soon as possible.</li>
                        </ul>
                        <Link href="/help/contacts"> 
                            <Button variant="secondary" className="mt-2">
                                Submit a ticket
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}