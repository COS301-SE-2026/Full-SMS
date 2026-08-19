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
// }// }

const SUPABASE_URL="https://pytgxhfpwiluexvyxicr.supabase.co"
const NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGd4aGZwd2lsdWV4dnl4aWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MTA4ODAsImV4cCI6MjEwMDM4Njg4MH0.m_npTioTNKfN5L4znKm55pLP5IfvNKYKd9dQdXKWrQk"

Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url:`${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        headers: {
            apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

