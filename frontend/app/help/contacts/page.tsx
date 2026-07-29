"use client"

import { Button } from "@/components/ui"
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/Card"
import { Mail } from "lucide-react"
import { Modal } from "@/components/ui/Modal";
import { MenuBar } from "@/components/analysisHub/menu-bar"
import { useState } from "react";

export default function ContactSupport(){
    const[message,setMessage] = useState('')
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

            <section className="px-4 mx-auto max-w-7xl py-2">
                <Card className="">
                    <CardHeader>
                        <div className="group-hover:bg-primary group-hover:text-background transition-colors   w-11 h-11 rounded bg-primary/10 flex items-center justify-center text-primary"><Mail /></div>
                        <CardTitle>Contact support</CardTitle>
                        <CardDescription>Reach out to the development team for additional help</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <textarea
                    value ={message}
                    rows={5}
                    placeholder="I am struggling to..."
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"/>

                    <div className="flex flex-row gap-2">
                        <Button variant="primary" className="px-3 py-2">
                            Submit a ticket
                        </Button>
                        <Button variant="secondary" className="">
                            Cancel
                        </Button>
                    </div>
                    </CardContent>
                    
                    
                </Card>
            </section>
        </main>
    )
}
