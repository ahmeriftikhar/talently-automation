import { selectors } from '../selectors/selectors';

Cypress.Commands.add('handleCookieConsent', () => {
    cy.get('body').then(($body) => {
        if ($body.find(selectors.cookies.acceptAllButton).length > 0) {
            cy.log('Cookie consent modal detected - accepting all cookies');
            cy.get(selectors.cookies.acceptAllButton).click();
            cy.get(selectors.cookies.acceptAllButton).should('not.exist');
        } else {
            cy.log('No cookie consent modal detected');
        }
    });
});

Cypress.Commands.add('navigateToJobsPage', () => {
    cy.get('body').then(($body) => {
        if ($body.find(selectors.sidebar.jobsButton).length > 0) {
            cy.log('Navigating to Jobs page via sidebar');
            cy.get(selectors.sidebar.jobsButton).click();
            cy.url().should('include', '/create-job');
        } else {
            cy.log('Already on Jobs page or sidebar not visible');
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

    // Navigate from Dashboard to Jobs page if needed
    cy.url().then((url) => {
        if (url.includes('/dashboard')) {
            cy.navigateToJobsPage();
        } else {
            cy.url().should('include', '/create-job');
        }
    });
});
