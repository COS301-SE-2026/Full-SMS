describe('Help Menu Tutorial', () => {
    beforeEach(() => {
        cy.login('default@user.com','Password@1')
        cy.visit('/help')
        cy.contains('Getting Started').click({force: true})
    })
