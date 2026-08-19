describe('Help Menu', () => {
    beforeEach(() => {
        cy.login('default@user.com', 'Password@1')
        cy.visit('/help')
    })

    it('displays the correct heading', () => {
        cy.contains('How can we help you?')
        .should('be.visible')
    })
