import { selectors } from '../selectors/selectors';

Cypress.Commands.add('handleCookieConsent', () => {
    // Wait for cookie consent modal to appear with extended timeout
    cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find(selectors.cookies.acceptAllButton, { timeout: 10000 }).length > 0) {
            cy.log('Cookie consent modal detected - accepting all cookies');
            cy.get(selectors.cookies.acceptAllButton, { timeout: 5000 }).should('be.visible').click();
            cy.get(selectors.cookies.acceptAllButton, { timeout: 5000 }).should('not.exist');
        } else {
            cy.log('No cookie consent modal detected');
        }
    });
});

Cypress.Commands.add('navigateToJobsPage', () => {
    cy.get('body').then(($body) => {
        // First try the Add Job button on dashboard
        if ($body.find(selectors.dashboard.addJobButton).length > 0) {
            cy.log('Navigating to Jobs page via Add Job button');
            cy.get(selectors.dashboard.addJobButton).click();
            cy.url().should('include', '/create-job');
        } else if ($body.find('button:has(svg)').length > 0) {
            // Try sidebar navigation - click the second button (Jobs button)
            cy.log('Navigating to Jobs page via sidebar');
            cy.get('button:has(svg)').eq(1).click();
            cy.url().should('include', '/create-job');
        } else {
            cy.log('Already on Jobs page or navigation not found');
        }
    });
});

Cypress.Commands.add('loginAsAutomationCompany', () => {
    cy.requireTalentlyEnv(['companyEmail', 'companyPassword']);

    const email = Cypress.env('companyEmail') || Cypress.env('COMPANY_EMAIL');
    const password = Cypress.env('companyPassword') || Cypress.env('COMPANY_PASSWORD');
    const backendBaseUrl = Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

    cy.intercept('POST', `${backendBaseUrl}/company/login`).as('companyLogin');
    cy.visit(Cypress.config('loginUrl'));

    // Handle cookie consent if present
    cy.handleCookieConsent();

    cy.get(selectors.auth.emailInput).clear().type(email);
    cy.get(selectors.auth.passwordInput).clear().type(password, { log: false });
    cy.get(selectors.auth.loginButton).click();
    cy.wait('@companyLogin').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Wait for navigation after login
    cy.url().should('not.include', '/login');
});
