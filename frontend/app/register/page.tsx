"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useAuth } from "@/contexts/authContext/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"

const RegisterSchema = Yup.object({
    username: Yup.string()
        .min(3, "Username must be at least 3 characters")
        .required("Username is required"),
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/[0-9]/, "Password must contain at least one number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
        .required("Password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords do not match")
        .required("Please confirm your password") ,

})

export default function RegisterPage() {
        const { signUp } = useAuth()
        const router = useRouter()
        const [errorMessage, setErrorMessage] = useState("")
        const [successMessage, setSuccessMessage] = useState("")

        const formik = useFormik({
            initialValues: {
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
            },
            validationSchema: RegisterSchema,
            onSubmit: async (values, { setSubmitting }) => {
                try {
                    setErrorMessage("")
                    setSuccessMessage("")

                    const { user, error: signUpError } = await signUp(values.email, values.password)

                    if (signUpError) {
                        setErrorMessage(signUpError.message || "Registration failed")
                        setSubmitting(false)
                        return
                    }

                    setSuccessMessage("Account created! Please check your email to verify your account.")
                    setTimeout(() => {
                        router.push("/login")
                    }, 2000)

                } catch (error: any) {
                    console.error("Registration error:", error)
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
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>Enter your details to get started</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {errorMessage && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-sm text-green-500">{successMessage}</p>
                        </div>
                    )}
                    <Input
                        label="Username"
                        type="text"
                        placeholder="e.g User12345"
                        {...formik.getFieldProps("username")}
                        error={formik.touched.username && formik.errors.username ? formik.errors.username : undefined}
                    />
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
                        placeholder="Create a password"
                        {...formik.getFieldProps("password")}
                        error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}                
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Re-type password"
                         {...formik.getFieldProps("confirmPassword")}
                        error={formik.touched.confirmPassword && formik.errors.confirmPassword ? formik.errors.confirmPassword : undefined}                
                    />
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full"
                        loading={formik.isSubmitting}
                        onClick={() => formik.handleSubmit()}
                    >
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
