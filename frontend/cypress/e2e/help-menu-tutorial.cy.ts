describe('Help Menu Tutorial', () => {
    beforeEach(() => {
        cy.login('default@user.com','Password@1')
        cy.visit('/help')
        cy.contains('Getting Started').click({force: true})
    })

    it('step 1 contains How to create a workspace', () => {
        cy.get('[data-cy="step-tutorial-title"]').should('contain', 'How to create a workspace')
    })

    it('shows the right step when Getting Started is opened', () => {
        cy.get('[data-cy="step-counter"]').should('contain', 'Step 1 of 3')
    })
