import { selectors } from '../selectors/selectors';

Cypress.Commands.add('handleCookieConsent', ({ timeout = 15000, interval = 500 } = {}) => {
    // The consent modal loads asynchronously and can appear AFTER the page is otherwise ready.
    // Instead of a fixed cy.wait (which misses a late modal and then lets it block later clicks),
    // poll the DOM up to `timeout` ms: dismiss the modal the moment it appears, and if it never
    // shows within the window, continue gracefully (it is optional, not every visit shows it).
    const acceptBtn = selectors.cookies.acceptAllButton;
    const maxAttempts = Math.max(1, Math.ceil(timeout / interval));

    const poll = (attemptsLeft) => {
        return cy.get('body', { log: false }).then(($body) => {
            if ($body.find(acceptBtn).length > 0) {
                cy.log('Cookie consent modal detected - accepting all cookies');
                cy.get(acceptBtn, { timeout: interval }).click({ force: true });
                // Ensure it is actually gone before proceeding, so it cannot overlay the login form.
                return cy
                    .get('body', { log: false })
                    .should(($b) => {
                        expect($b.find(acceptBtn).length, 'cookie consent dismissed').to.eq(0);
                    });
            }

            if (attemptsLeft <= 1) {
                cy.log('No cookie consent modal appeared within timeout - continuing');
                return;
            }

            // Not there yet — wait one short interval and re-check (handles the late-loading case).
            return cy.wait(interval, { log: false }).then(() => poll(attemptsLeft - 1));
        });
    };

    return poll(maxAttempts);
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
    cy.handleCookieConsent({timeout: 10000});

    cy.get(selectors.auth.emailInput).clear().type(email);
    cy.get(selectors.auth.passwordInput).clear().type(password, { log: false });
    cy.get(selectors.auth.loginButton).click();
    cy.wait('@companyLogin').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Wait for navigation after login
    cy.url().should('not.include', '/login');
});
