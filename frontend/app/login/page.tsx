"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 dark">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Input
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                    onChange={() => {}}
                    />
                    <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    onChange={() => {}}
                    />
                </CardContent>
                <CardFooter className="justify-center border-t border-border">
                </CardFooter>
            </Card>
        </div>
    )
}