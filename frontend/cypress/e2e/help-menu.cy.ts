describe('Help Menu', () => {
    beforeEach(() => {
        cy.login('default@user.com', 'Password@1')
        cy.visit('/help')
    })

    it('displays the correct heading', () => {
        cy.contains('How can we help you?')
        .should('be.visible')
    })

    it('navigates to Getting Started', () => {
        cy.contains('Getting Started').click({force: true})
        cy.url().should('include','/help/gettingStarted')
    })

    it('navigates to Saving and Loading a session', () => {
        cy.contains('Saving and Loading a Session').click({force: true})
        cy.url().should('include','/help/session')
    })

