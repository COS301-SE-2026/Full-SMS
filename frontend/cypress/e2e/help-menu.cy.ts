describe('Help Menu', () => {
    beforeEach(() => {
        cy.login('default@user.com', 'Password@1')
        cy.visit('/help')
    })

    it('displays the correct heading', () => {
        cy.contains('How can we help you?')
        .should('be.visible')
    })
    //

    const testCases = [
        {item:'Getting Started', route: '/help/gettingStarted'},
        {item:'Saving and Loading a Session', route: '/help/session'},
        {item:'Analysis Features', route: '/help/analysisFeatures'},
        {item:'File formats', route: '/help/fileFormats'},
        {item:'Plugin', route: '/help/plugin'},
        {item:'Export', route: '/help/export'},
        {item:'FAQs', route: '/help/faqs'},
        {item: 'Submit a ticket', route: '/help/contacts'}

    ]

    it('expands a section when the accordion is clicked', () => {
        cy.visit('/help/faqs')
        cy.get('[data-cy="accordion-toggle-1"]').click({force: true})
        cy.get('[data-cy="accordion-content-1"]').should('not.exist')
    })

    testCases.forEach(({item, route}) => {
        it(`navigates to ${item}`, () => {
            cy.contains(item).click({force: true})
            cy.url().should('include', route)
        })
    })
})

describe('Contact Support', () => {
    beforeEach(() => {
        cy.login('default@user.com', 'Password@1')
        cy.visit('/help/contacts')
        cy.intercept('POST', '/api/py/support/**', {response: 'Contact support works'})
    })

    it('submits a ticket successfully', () => {
        cy.get('[data-cy="ticket-message-input"]').type('Default message')
        cy.get('[data-cy="submit-ticket-button"]').click()
        cy.contains('Ticket sent successfully!').should('be.visible')
    })
})
