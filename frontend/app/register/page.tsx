"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

const RegisterSchema = Yup.object({
    username: Yup.string()
        .min(3, "Username must be at least 3 characters")
        .required("Username is required"),
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords do not match")
        .required("Please confirm your password") ,

})

export default function RegisterPage() {
        const formik = useFormik({
            initialValues: {
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
            }, 
            validationSchema: RegisterSchema, 
            onSubmit: (values, { setSubmitting }) => {
                //connect to API backend 
                console.log(values)
                setSubmitting(false)
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
                    <Input
                        label="Username"
                        type="text"
                        placeholder="your_username"
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
                        placeholder="Enter your password"
                        {...formik.getFieldProps("password")}
                        error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}                
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Repeat your password"
                         {...formik.getFieldProps("confirmPassword")}
                        error={formik.touched.confirmPassword && formik.errors.confirmPassword ? formik.errors.confirmPassword : undefined}                
                    />
                    <Button 
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
