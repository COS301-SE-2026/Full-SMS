/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }


Cypress.Commands.add('login', (email, password) => {
    const SUPABASE_URL = Cypress.env('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Cypress.env('SUPABASE_ANON_KEY')
    cy.request({
        method: 'POST',
        url:`${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        headers: {
            apikey: SUPABASE_ANON_KEY,
        },
        body: {
            email,
            password,
        },
    }).then((response) => {
    window.localStorage.setItem(
        'sb-pytgxhfpwiluexvyxicr-auth-token',
        JSON.stringify(response.body)
    )
})
}) 

declare global{
    namespace Cypress{
        interface Chainable{
            login(email: string, password: string): Chainable<void>
        }
    }
}
