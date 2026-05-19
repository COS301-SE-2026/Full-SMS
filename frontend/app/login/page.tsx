"use client"

import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

const LoginSchema = Yup.object({
    email: Yup.string()
        .email("Enter a valid email address")
        .required("Email is required"),
    password: Yup.string()
        .required("Password is required"),

})

export default function LoginPage() {
    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        }, 
        validationSchema: LoginSchema, 
        onSubmit: (values, { setSubmitting }) => {
            console.log(values)
            setSubmitting(false)
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