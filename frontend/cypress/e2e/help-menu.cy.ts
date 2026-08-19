describe('Help Menu', () => {
    beforeEach(() => {
        cy.login('default@user.com', 'Password@1')
        cy.visit('/help')
    })

