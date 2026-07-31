"use client"

import { Button } from "@/components/ui"
import { Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/Card"
import { Mail } from "lucide-react"
import { useState } from "react";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { supportService } from "@/services/supportServices";
import { useToast } from "@/contexts/toastContext/ToastContext";
import HelpHero from "@/components/help/HelpHero"

export default function ContactSupport(){
    const[message,setMessage] = useState('')
    const { errorToast, successToast} = useToast()
    const {user} = useAuth()
    return(
        <main>
            <HelpHero />
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
                        <Button onClick={async () => {
                            if (!user?.email) {return}
                            try{
                                await supportService.sendEmail(user?.email, message)
                                successToast("Ticket sent successfully!")
                                setMessage('')
                            }catch(error){
                                console.error("Failed to send ticket",error);
                                errorToast("Failed to send ticket")
                            }}}
                             variant="primary" className="px-3 py-2" >
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
