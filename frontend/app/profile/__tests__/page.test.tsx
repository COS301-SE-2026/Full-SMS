import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePage from "../page"
import { AuthProvider } from "@/contexts/authContext/AuthContext"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
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

import { supabase } from "@/lib/supabase/supabaseConfig"

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
    })

    it("renders the profile page correctly", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        expect(screen.getAllByText("researcher_one")[0]).toBeInTheDocument()
        expect(screen.getByText("Account Information")).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
        expect(screen.getByText("Preferences")).toBeInTheDocument()
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

    it("renders the dark mode toggle", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        expect(screen.getByText("Dark Mode")).toBeInTheDocument()
        expect(screen.getByRole("switch")).toBeInTheDocument()
    })

     it("renders the logout button", async () => {
        renderWithAuth(<ProfilePage />)
        await waitFor(() => {
            expect(screen.getByText("My Profile")).toBeInTheDocument()
        })
        expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    })    

})

