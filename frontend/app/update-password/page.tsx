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
import { useToast } from "@/contexts/toastContext/ToastContext"

const UpdatePasswordSchema = Yup.object({
    password: Yup.string()
        .required("Password is required"),
})

export default function UpdatePasswordPage() {
    const { updatePassword } = useAuth()
    const router = useRouter()
    const [errorMessage, setErrorMessage] = useState("")
    const { errorToast, successToast } = useToast()

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: UpdatePasswordSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setErrorMessage("")
                const { error: updateError } = await updatePassword(values.password)

                if (updateError) {
                    setErrorMessage(updateError.message || "Failed to update password")
                    setSubmitting(false)
                    return
                }

                successToast("Your password has been updated successfully. Please log in with your new password.")
                router.push("/login")

            } catch (error: any) {
                setErrorMessage("An error occurred while trying to update your password. Please try again.")
                errorToast("An error occurred while trying to update your password. Please try again.")
            } finally {
                setSubmitting(false)
            }
        },
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 dark">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Update Password</CardTitle>
                    <CardDescription>Enter your new password</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {errorMessage && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </div>
                    )}
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
                        className="w-full mt-2"
                        loading={formik.isSubmitting}
                        onClick={() => formik.handleSubmit()}
                        >
                        Update Password
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}