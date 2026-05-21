"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"


function Avatar({ username }: { username: string}) {
    const initials = username
        .split("_")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return(
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
    )
}

function RoleBadge({ role }: { role: string }) {
    const colours: Record<string, string> = {
        owner:"bg-primary/20 text-primary border border-primary/30",
        researcher: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        collaborator: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        administrator: "bg-red-500/20 text-red-400 border border-red-500/30",

    }
    return (
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${colours[role] ?? "bg-border text-foreground"}`}>
           {role.charAt(0).toUpperCase() + role.slice(1)} 
        </span>
    )
}

function InfoRow({ label, value }: { label: string; value: string}){
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <span className="text-sm text-foreground/60">{label}</span>
            <span className="text-sm text-foreground font-medium">{value}</span>
        </div>
    )
}
export default function ProfilePage(){
    const [isEditing, setIsEditing] = useState(false)

    const mockUser = {
        username: "researcher_one",
        email: "researcher_one@up.ac.za",
        role: "researcher",
        joinedDate: "January 2026",
        datasets: 12,
        sessions: 34,
    }
    return(
        <div className="min-h-screen bg-background px-4 py-8 dark">
            <div className="max-w-lg mx-auto">
                <div className="flex flex-col items-center gap-3 mb-6">
                    <Avatar username={mockUser.username}/>
                    <div className="text-center">
                        <h1 className="text-xl font-semibold text-foreground">{mockUser.username}</h1>
                        <p className="text-sm text-foreground/60">{mockUser.email}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <RoleBadge role={mockUser.role} />
                            <span className="text-xs text-foreground/40">Member since {mockUser.joinedDate}</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-card border border-border rounded-md p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{mockUser.datasets}</p>
                    <p className="text-xs text-foreground/60 mt-1">Datasets Uploaded</p>
                </div>
                <div className="bg-card border border-border rounded-md p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{mockUser.sessions}</p>
                    <p className="text-xs text-foreground/60 mt-1">Analysis Sessions</p>
                </div>            
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Account Information</CardTitle>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="flex flex-col gap-4">
                            <Input
                                label="Username"
                                type="text"
                                defaultValue={mockUser.username}
                                onChange={() => {}}
                            />
                             <Input
                                label="Email"
                                type="email"
                                value={mockUser.email}
                                disabled
                                helperText="Email cannot be changed"
                                onChange={() => {}}
                            />
                            <div className="flex gap-2 mt-2">
                                <Button variant="primary" size="sm" className="flex-1">
                                    Save changes
                                </Button>
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setIsEditing(false)}
                                >
                                  Cancel  
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <>
                        <InfoRow label="Username" value={mockUser.username}/>
                        <InfoRow label="Email" value={mockUser.email}/>
                        <InfoRow label="Role" value={mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)}/>
                        <InfoRow label="Member Since" value={mockUser.joinedDate}/>
                    </>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
    )
}

