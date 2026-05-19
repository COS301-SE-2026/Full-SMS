"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 dark">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>Enter your details to get started</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Input
                        label="Username"
                        type="text"
                        placeholder="your_username"
                        onChange={() => {}}
                    />
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
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Repeat your password"
                        onChange={() => {}}
                    />
                    <Button variant="primary" size="md" className="w-full">
                        Sign up
                    </Button>
                </CardContent>
                <CardFooter className="justify-center border-t border-border">
                    <p className="text-sm text-foreground/60">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Log in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
