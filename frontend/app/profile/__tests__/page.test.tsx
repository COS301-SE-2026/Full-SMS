import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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

    it("renders the logout button", () => {
        render(<ProfilePage />)
        expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument()
    })    


    it("renders the dark mode toggle", () => {
        render(<ProfilePage />)
        expect(screen.getByText("Dark Mode")).toBeInTheDocument()
        expect(screen.getByRole("switch")).toBeInTheDocument()
    })
})

