"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useAuth } from "@/contexts/authContext/AuthContext"
import { authService } from "@/services/authServices"
import { useRouter } from "next/navigation"
import { useState } from "react"

const LoginSchema = Yup.object({
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .required("Password is required"),

})

export default function LoginPage() {
    const { signIn } = useAuth()
    const router = useRouter()
    const [errorMessage, setErrorMessage] = useState("")

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: LoginSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setErrorMessage("")

                const { user, error: signInError } = await signIn(values.email, values.password)

                if (signInError) {
                    setErrorMessage(signInError.message || "Login failed")
                    setSubmitting(false)
                    return
                }

                // Step 2: Verify token with backend
                try {
                    const verifyResponse = await authService.verifyToken()

                    if (verifyResponse.valid) {
                        window.location.href = "/analysisHub"
                    } else {
                        setErrorMessage("Token verification failed")
                    }
                } catch (verifyError: any) {
                    console.error("Backend verification error:", verifyError)
                    setErrorMessage("Unable to verify authentication with server")
                }

            } catch (error: any) {
                console.error("Login error:", error)
                setErrorMessage(error.message || "An unexpected error occurred")
            } finally {
                setSubmitting(false)
            }
        },
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 dark">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {errorMessage && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </div>
                    )}
                    <Input
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        {...formik.getFieldProps("email")}
                        error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        {...formik.getFieldProps("password")}
                        error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
                    />
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full"
                        loading={formik.isSubmitting}
                        onClick={() => formik.handleSubmit()}
                        >
                        Sign in
                    </Button>
                </CardContent>
                <CardFooter className="justify-center border-t border-border">
                    <p className="text-sm text-foreground/60">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}