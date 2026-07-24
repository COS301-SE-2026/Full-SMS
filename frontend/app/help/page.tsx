"use client"

import { Button } from "@/components/ui"
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/Card"
import { icons, BookOpen, ChartColumn, FileSearchCorner, Download, CircleQuestionMark, Save, Phone } from "lucide-react"

export default function HelpMenuPage(){
    return(
        <main>
            <div>
                <h3>How can we help you?</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <BookOpen color="#00e5ff" />
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>Are you new to FullSMS? This is for you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <li>How to upload a file</li>
                            <span>Create a workspace in the Workspace Dashboard page. Click into it and navigate to the File Upload Page. Upload your file then select "Open" to start your file analysis session.
                                 Pick your measurements and navigate to the analysis tab you need.</span>
                            <li>How to navigate the tabs</li>
                            <p>All analysis tabs are in the side menu. You can navigate to the intensity, grouping, spectra and raster.</p>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Save color="#00e5ff" />
                        <CardTitle>Save and Load session</CardTitle>
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
