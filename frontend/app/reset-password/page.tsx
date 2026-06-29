"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toastContext/ToastContext";

const ResetPasswordSchema = Yup.object({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),
});

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { errorToast, successToast } = useToast();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: ResetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { error: resetError } = await resetPassword(values.email);

        if (resetError) {
          errorToast("Failed to send reset instructions");
          setSubmitting(false);
          return;
        }

        successToast(
          "If an account with that email exists, you will receive password reset instructions shortly.",
        );
        router.push("/login");
      } catch (error: any) {
        console.error("Error during password reset:", error);
        errorToast(
          "An error occurred while trying to reset your password. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 dark">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to receive password reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            {...formik.getFieldProps("email")}
            error={
              formik.touched.email && formik.errors.email
                ? formik.errors.email
                : undefined
            }
          />

          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full mt-2"
            loading={formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            Reset Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}