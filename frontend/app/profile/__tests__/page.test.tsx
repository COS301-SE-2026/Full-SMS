import { render, screen } from "@testing-library/react"
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

    it("renders the dark mode toggle", () => {
        render(<ProfilePage />)
        expect(screen.getByText("Dark Mode")).toBeInTheDocument()
        expect(screen.getByRole("switch")).toBeInTheDocument()
    })
})

