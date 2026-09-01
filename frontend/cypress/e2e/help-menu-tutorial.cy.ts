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

    it('clicking Next moves the tutorial to step 2', () => {
        cy.clickNextTimes(1)
        cy.get('[data-cy="step-tutorial-title"]').should('contain',"How to upload a file for analysis")
        cy.get('[data-cy="step-counter"]').should('contain', 'Step 2 of 3')
    })

     it('clicking Back moves the tutorial from step 2 to step 1', () => {
        cy.clickNextTimes(1)
        cy.get('[data-cy="back-button"]').click()
        cy.get('[data-cy="step-tutorial-title"]').should('contain',"How to create a workspace")
        cy.get('[data-cy="step-counter"]').should('contain', 'Step 1 of 3')
    })

     it('clicking Back in step 1 does nothing ', () => {
        cy.get('[data-cy="back-button"]').click()
        cy.get('[data-cy="step-tutorial-title"]').should('contain',"How to create a workspace")
        cy.get('[data-cy="step-counter"]').should('contain', 'Step 1 of 3')
    })

    it('next button changes to Finish button in step 3', () => {
        cy.clickNextTimes(2)
        cy.get('[data-cy="next-button"]').should('contain', 'Finish')
        cy.get('[data-cy="step-tutorial-title"]').should('contain',"How to navigate to the Analysis Hub Page")
        cy.get('[data-cy="step-counter"]').should('contain', 'Step 3 of 3')
    })

