import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePage from "../page"
import { AuthProvider } from "@/contexts/authContext/AuthContext"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
    usePathname:() => "/profile",
}))

jest.mock("@/lib/supabase/supabaseConfig", () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(),
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            resetPasswordForEmail: jest.fn(),
            updateUser: jest.fn(),
        },
    },
}))

jest.mock("@/lib/api/axiosInstance", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}))

jest.mock("@/services/sessionsServices", () => ({
    sessionsService: {
        getSessions: jest.fn(),
    },
}))

import { supabase } from "@/lib/supabase/supabaseConfig"
import axiosInstance from "@/lib/api/axiosInstance"
import { sessionsService } from "@/services/sessionsServices"
import { usePathname } from "next/navigation"

const renderWithAuth = (component: React.ReactElement) => {
    return render(<AuthProvider>{component}</AuthProvider>)
}

describe("ProfilePage", () => {
    beforeEach(() => {
        jest.clearAllMocks()

        const mockSession = {
            user: {
                id: "123",
                email: "researcher_one@example.com",
                created_at: "2024-01-01T00:00:00Z",
                user_metadata: { role: "researcher" }
            },
            access_token: "mock-token",
        }

        ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
            data: { session: mockSession },
        })

        const mockSubscription = { unsubscribe: jest.fn() }
        ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
            data: { subscription: mockSubscription },
        })

        ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
            data: { user: mockSession.user },
            error: null,
        })

        ;(axiosInstance.get as jest.Mock).mockResolvedValue({
            data: { username: "researcher_one", email: "researcher_one@example.com", role: "researcher"},
        })

        ;(axiosInstance.put as jest.Mock).mockResolvedValue({
            data: { username: "newusername", email: "researcher_one@example.com", role: "researcher"},
        })

        ;(sessionsService.getSessions as jest.Mock).mockResolvedValue([])
    })

    it("renders the profile page correctly", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        expect(screen.getAllByText("researcher_one")[0]).toBeInTheDocument()
        expect(screen.getByText("Account Information")).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
        // expect(screen.getByText("Preferences")).toBeInTheDocument()
    })

    it("renders the role badge", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getAllByText("Researcher")[0]).toBeInTheDocument()
        })
    })

   it("clicking Edit shows the edit form", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => {
            expect(screen.getByLabelText("Username")).toBeInTheDocument()
            expect(screen.getByLabelText("Email")).toBeInTheDocument()
        })
   })

   it("clicking Cancel in edit mode hides the form", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => expect(screen.getByLabelText("Username")).toBeInTheDocument())
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
        await waitFor(() => {
            expect(screen.queryByLabelText("Username")).not.toBeInTheDocument()
        })
   })

   it("shows username error when username is too short", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => expect(screen.getByLabelText("Username")).toBeInTheDocument())
        await userEvent.clear(screen.getByLabelText("Username"))
        await userEvent.type(screen.getByLabelText("Username"), "ab")
        fireEvent.click(screen.getByRole("button", { name: /save/i }))
        await waitFor(() => {
            expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument()
        })
   })

   it("clicking Change shows the password form", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /change/i }))
        await waitFor(() => {
            expect(screen.getByLabelText("New Password")).toBeInTheDocument()
            expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
         })
   })

   it("shows error when passwords do not match", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /change/i }))
        await waitFor(() => expect(screen.getByLabelText("New Password")).toBeInTheDocument())
        await userEvent.type(screen.getByLabelText("New Password"), "password123")
        await userEvent.type(screen.getByLabelText("Confirm Password"), "different123")
        fireEvent.click(screen.getByRole("button", { name: /update password/i }))
        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
         })
   })

    // it("renders the dark mode toggle", async () => {
    //     renderWithAuth(<ProfilePage />)
    //     await waitFor(() => {
    //         expect(screen.getByText("My Profile")).toBeInTheDocument()
    //     })
    //     expect(screen.getByText("Dark Mode")).toBeInTheDocument()
    //     expect(screen.getByRole("switch")).toBeInTheDocument()
    // })

    it("renders the logout button", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        const logoutButtons = screen.getAllByRole("button", {name: /log out/i})
        expect(logoutButtons.length).toBeGreaterThan(0)
    })  

    it("shows loading state before profile data arrives", async () => {
        let resolveGet: (value: any) => void
        ;(axiosInstance.get as jest.Mock).mockReturnValue(new Promise((resolve) => { resolveGet = resolve }))
        renderWithAuth(<ProfilePage />)
        expect(screen.getByText("Loading profile...")).toBeInTheDocument()

        resolveGet!({
            data: {username: "researcher_one", email: "researcher_one@example.com", role: "researcher"},
        })
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
    })   

    it("shows an error message when profile fetch fails", async () => {
        ;(axiosInstance.get as jest.Mock).mockRejectedValue(new Error("Network error"))

        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("Failed to load profile")).toBeInTheDocument()
        })
    }) 

    it("shows error message when profile update fails", async () => {
        ;(axiosInstance.put as jest.Mock).mockRejectedValue(new Error("Network error"))

        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => expect(screen.getByLabelText("Username")).toBeInTheDocument())

        fireEvent.click(screen.getByRole("button", { name: /save/i }))
        await waitFor(() => {
            expect(screen.getByText("Failed to update profile")).toBeInTheDocument()
         })
   })

})

