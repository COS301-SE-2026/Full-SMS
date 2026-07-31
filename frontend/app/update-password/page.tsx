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

const UpdatePasswordSchema = Yup.object({
  password: Yup.string().required("Password is required"),
});

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const { errorToast, successToast } = useToast();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: UpdatePasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { error: updateError } = await updatePassword(values.password);

        if (updateError) {
          if (updateError.status === 422) {
            errorToast(
              "Your new password cannot be the same as your old password. Please choose a different password.",
            );
          } else {
            errorToast(updateError.message || "Failed to update password");
          }
          setSubmitting(false);
          return;
        }

        successToast(
          "Your password has been updated successfully. Please log in with your new password.",
        );
        router.push("/login");
      } catch (error: any) {
        console.error("Error during password update:", error);
        errorToast(
          "An error occurred while trying to update your password. Please try again.",
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
          <CardTitle className="text-xl">Update Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...formik.getFieldProps("password")}
            error={
              formik.touched.password && formik.errors.password
                ? formik.errors.password
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
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}