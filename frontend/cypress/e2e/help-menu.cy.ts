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

    it('navigates to Analysis Features', () => {
        cy.contains('Analysis Features').click({force: true})
        cy.url().should('include','/help/analysisFeatures')
    })

    it('navigates to File formats', () => {
        cy.contains('File formats').click({force: true})
        cy.url().should('include','/help/fileFormats')
    })

    it('navigates to Plugin', () => {
        cy.contains('Plugin').click({force: true})
        cy.url().should('include','/help/plugin')
    })

     it('navigates to Export', () => {
        cy.contains('Export').click({force: true})
        cy.url().should('include','/help/export')
    })

     it('navigates to FAQs', () => {
        cy.contains('FAQs').click({force: true})
        cy.url().should('include','/help/faqs')
    })

     it('navigates to Submit a ticket', () => {
        cy.contains('Submit a ticket').click({force: true})
        cy.url().should('include','/help/contacts')
    })

