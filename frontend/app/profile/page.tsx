"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Toggle } from "@/components/ui/Toggle"
import { useAuth } from "@/contexts/authContext/AuthContext"

function Avatar({ email }: { email: string}) {
    // Get initials from email (first letter before @)
    const initial = email.charAt(0).toUpperCase()

    return(
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">{initial}</span>
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
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            colours[role] ?? "bg-border text-foreground"
            }`}
            >
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

const ProfileSchema = Yup.object({
    username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
})

const PasswordSchema = Yup.object({
    newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("New password is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords do not match")
        .required("Please confirm your password"),
})

export default function ProfilePage(){
    const [isEditing, setIsEditing] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const [successMessage, setSuccessMessage] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState("")
    const { user, signOut, updatePassword } = useAuth()
    const router = useRouter()

    // Derive username from email (part before @)
    const username = user?.email?.split('@')[0] || 'User'
    const email = user?.email || ''
    const role = user?.user_metadata?.role || 'researcher'
    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently'

    const handleThemeToggle = (checked: boolean) => {
        setDarkMode(checked)
    }

    const handleLogout = async() => {
        try {
            const { error } = await signOut()
            if (error) {
                console.error("Logout error:", error)
            } else {
                router.push('/login')
            }
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const profileFormik = useFormik({
        initialValues: { username },
        enableReinitialize: true,
        validationSchema: ProfileSchema,
        onSubmit: (values, { setSubmitting }) => {
            //will connect to  profile update API
            console.log("Profile updated:", values)
            setSubmitting(false)
            setIsEditing(false)
            setSuccessMessage("Profile updated successfully")
            setTimeout(() => setSuccessMessage(""), 3000)
        },
    })

    const passwordFormik = useFormik({
        initialValues: { newPassword: "", confirmPassword: "" },
        validationSchema: PasswordSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                const { error } = await updatePassword(values.newPassword)
                if (error) {
                    console.error("Password update error:", error)
                    setPasswordSuccess("Failed to update password")
                } else {
                    setPasswordSuccess("Password updated successfully")
                    resetForm()
                    setIsChangingPassword(false)
                }
            } catch (error) {
                console.error("Password update error:", error)
                setPasswordSuccess("Failed to update password")
            }
            setSubmitting(false)
            setTimeout(() => setPasswordSuccess(""), 3000)
        },
    })

    return(
        <div className={`min-h-screen bg-background px-4 py-8 ${darkMode ? "dark" : ""}`}>
            <div className="w-full">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-lg font-semibold text-foreground">My Profile</h1>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-8 px-2">

                <div className="col-span-1 flex flex-col gap-4">
                {/* Avatar and user info */}
                <div className="bg-card border border-border rounded-md p-6 flex flex-col items-center gap-3">
                    <Avatar email={email}/>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            {username}
                        </h2>
                        <p className="text-sm text-foreground/60">{email}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <RoleBadge role={role} />
                            <span className="text-xs text-foreground/40">Since {joinedDate}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
                <div className="bg-card border border-border rounded-md p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-xs text-foreground/60 mt-1">Datasets Uploaded</p>
                </div>
                <div className="bg-card border border-border rounded-md p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-xs text-foreground/60 mt-1">Analysis Sessions</p>
                </div>
            </div>

            <div className="col-span-2 flex flex-col gap-4">
                {successMessage && (
                    <p className="text-sm text-primary text-center font-medium">
                        {successMessage}
                    </p>
                )}


            {/* Account information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Account Information</CardTitle>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                Edit 
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
                                {...profileFormik.getFieldProps("username")}
                                error={
                                    profileFormik.touched.username &&
                                    profileFormik.errors.username
                                        ? profileFormik.errors.username
                                        : undefined
                                }
                            />
                             <Input
                                label="Email"
                                type="email"
                                value={email}
                                disabled
                                helperText="Email cannot be changed"
                                onChange={() => {}}
                            />
                            <div className="flex gap-2 mt-2">
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    className="flex-1" 
                                    loading={profileFormik.isSubmitting} 
                                    onClick={() => profileFormik.handleSubmit()}
                                >
                                    Save
                                </Button>
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        setIsEditing(false)
                                        profileFormik.resetForm()
                                    }}
                                >
                                  Cancel  
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <>
                        <InfoRow label="Username" value={username}/>
                        <InfoRow label="Email" value={email}/>
                        <InfoRow
                            label="Role"
                            value={
                                role.charAt(0).toUpperCase() +
                                role.slice(1)
                            }
                        />
                        <InfoRow label="Member Since" value={joinedDate}/>
                    </>
                    )}
                </CardContent>
            </Card>

            {/* Password section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Password</CardTitle>
                        {!isChangingPassword && (
                            <Button
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsChangingPassword(true)}
                            >
                                Change
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isChangingPassword ? (
                        <div className="flex flex-col gap-4">
                           <Input
                                label="New Password"
                                type="password"
                                placeholder="Create a new password"
                                {...passwordFormik.getFieldProps("newPassword")}
                                error={
                                    passwordFormik.touched.newPassword &&
                                    passwordFormik.errors.newPassword
                                        ? passwordFormik.errors.newPassword
                                        : undefined
                                }
                            /> 
                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-type new password"
                                {...passwordFormik.getFieldProps("confirmPassword")}
                                error={
                                    passwordFormik.touched.confirmPassword &&
                                    passwordFormik.errors.confirmPassword
                                        ? passwordFormik.errors.confirmPassword
                                        : undefined
                                }
                            /> 
                            <div className="flex gap-2 mt-2">
                                <Button 
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    loading={passwordFormik.isSubmitting}
                                    onClick={() => passwordFormik.handleSubmit()}
                                >
                                  Update Password  
                                </Button>
                                 <Button 
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        setIsChangingPassword(false)
                                        passwordFormik.resetForm()
                                    }}
                                >
                                  Cancel  
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            {passwordSuccess ? (
                                <p className="text-sm text-primary font-medium">
                                    {passwordSuccess}
                                </p>
                            ) : (
                                <p className="text-sm text-foreground/60">
                                    Click change to update your password
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preferences */}
            {/* <Card>
                <CardHeader>
                    <CardTitle className="text-base">Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <Toggle
                        label="Dark Mode"
                        helperText="Switch between light and dark theme"
                        checked={darkMode}
                        onCheckedChange={handleThemeToggle}
                        />
                </CardContent>
            </Card> */}
            

               </div>     
            </div>
        </div>
    </div>
    )
}

