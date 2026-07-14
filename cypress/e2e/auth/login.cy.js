const loginUrl = Cypress.config('loginUrl');

describe('Authentication Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        cy.task('logMessage', {
            message: `Visiting login page: ${loginUrl}`,
            style: 'green',
        });
    });

    it('should successfully login with valid credentials', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should successfully login with valid credentials',
            style: 'blue',
        });

        cy.requireTalentlyEnv(['companyEmail', 'companyPassword']);

        const email = Cypress.env('companyEmail');
        const password = Cypress.env('companyPassword');
        const backendBaseUrl = Cypress.env('backendBaseUrl');

        cy.task('logMessage', {
            message: `Attempting login with email: ${email}`,
            style: 'gray',
        });

        cy.intercept('POST', `${backendBaseUrl}/company/login`).as('companyLogin');

        // Handle cookie consent if present
        cy.handleCookieConsent();

        // Fill login form
        cy.get('[name="email"]').clear().type(email);
        cy.get('[name="password"]').clear().type(password, { log: false });
        cy.get('#click-login').click();

        // Wait for login API call
        cy.wait('@companyLogin').then((interception) => {
            cy.task('logMessage', {
                message: `Login API response status: ${interception.response.statusCode}`,
                style: 'green',
            });
            expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        });

        // Verify successful login - should be redirected to create-job or dashboard
        cy.url().should('not.include', '/login');
        cy.task('logMessage', {
            message: 'Login successful - redirected from login page',
            style: 'green',
        });
    });

    it('should show error with invalid credentials', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should show error with invalid credentials',
            style: 'blue',
        });

        cy.intercept('POST', `${Cypress.env('backendBaseUrl')}/company/login`).as('companyLogin');

        // Handle cookie consent if present
        cy.handleCookieConsent();

        // Fill login form with invalid credentials
        cy.get('[name="email"]').clear().type('invalid@email.com');
        cy.get('[name="password"]').clear().type('invalidpassword');
        cy.get('#click-login').click();

        // Wait for login API call
        cy.wait('@companyLogin').then((interception) => {
            cy.task('logMessage', {
                message: `Login API response status: ${interception.response.statusCode}`,
                style: 'gray',
            });
            expect(interception.response.statusCode).to.not.be.oneOf([200, 201]);
        });

        // Verify error message is shown
        cy.get('[data-cy="toast-message"], .Toastify__toast-body, .text-sm > :nth-child(2)')
            .should('be.visible');
    });

    it('should validate required fields on login', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should validate required fields on login',
            style: 'blue',
        });

        // Handle cookie consent if present
        cy.handleCookieConsent();

        // Try to login without filling fields
        cy.get('#click-login').click();

        // Verify required field validation
        cy.get('.text-xs.text-red-500').should('be.visible');
    });
});
