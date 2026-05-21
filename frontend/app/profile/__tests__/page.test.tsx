import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePage from "../page"

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
}))

describe("ProfilePage", () => {
    it("renders the profile page correctly", () => {
        render(<ProfilePage />)
        expect(screen.getByText("My Profile")).toBeInTheDocument()
        expect(screen.getByText("researcher_one")).toBeInTheDocument()
        expect(screen.getByText("Account Information")).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
        expect(screen.getByText("Preferences")).toBeInTheDocument()

    })

    it("renders the role badge", () => {
        render(<ProfilePage />)
        expect(screen.getByText("Researcher")).toBeInTheDocument()
    })

   it("clicking Edit shows the edit form", async () => {
        render(<ProfilePage />)
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => {
        expect(screen.getByLabelText("Username")).toBeInTheDocument()
        expect(screen.getByLabelText("Email")).toBeInTheDocument()

        })
   })

   it("clicking Cancel in edit mode hides the form", async () => {
        render(<ProfilePage />)
        fireEvent.click(screen.getByRole("button", { name: /edit/i }))
        await waitFor(() => expect(screen.getByLabelText("Username")).toBeInTheDocument())
        fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
        await waitFor(() => {expect(screen.queryByLabelText("Username")).not.toBeInTheDocument()

        })
   })   

   it("shows username error when username is too short", async () => {
        render(<ProfilePage />)
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
        render(<ProfilePage />)
        fireEvent.click(screen.getByRole("button", { name: /change/i }))
        await waitFor(() => {
            expect(screen.getByLabelText("New Password")).toBeInTheDocument()
            expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
         })
   })

   it("shows error when passwords do not match", async () => {
        render(<ProfilePage />)
        fireEvent.click(screen.getByRole("button", { name: /change/i }))
        await waitFor(() => expect(screen.getByLabelText("New Password")).toBeInTheDocument())
        await userEvent.type(screen.getByLabelText("New Password"), "password123")
        await userEvent.type(screen.getByLabelText("Confirm Password"), "different123")
        fireEvent.click(screen.getByRole("button", { name: /update password/i }))
        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
         })
   })   

    it("renders the dark mode toggle", () => {
        render(<ProfilePage />)
        expect(screen.getByText("Dark Mode")).toBeInTheDocument()
        expect(screen.getByRole("switch")).toBeInTheDocument()
    })

     it("renders the logout button", () => {
        render(<ProfilePage />)
        expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    })    

})

