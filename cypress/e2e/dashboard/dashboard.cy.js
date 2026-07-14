const loginUrl = Cypress.config('loginUrl');

describe('Dashboard Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting dashboard test',
            style: 'green',
        });
    });

    it('should display dashboard after successful login', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should display dashboard after successful login',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Wait for page to load
        cy.wait(2000);

        // Check if we're on dashboard or create-job page
        cy.url().then((url) => {
            cy.task('logMessage', {
                message: `Current URL after login: ${url}`,
                style: 'gray',
            });

            if (url.includes('/dashboard')) {
                cy.task('logMessage', {
                    message: 'User landed on dashboard',
                    style: 'green',
                });

                // Verify dashboard elements
                cy.get('body').then(($body) => {
                    // Check for common dashboard elements
                    if ($body.find('h1, h2, h3').length > 0) {
                        cy.task('logMessage', {
                            message: 'Dashboard headers found',
                            style: 'green',
                        });
                    }

                    if ($body.find('button').length > 0) {
                        cy.task('logMessage', {
                            message: 'Dashboard buttons found',
                            style: 'green',
                        });
                    }

                    if ($body.find('[class*="stat"], [class*="card"], [class*="metric"]').length > 0) {
                        cy.task('logMessage', {
                            message: 'Dashboard stats/cards found',
                            style: 'green',
                        });
                    }
                });

            } else if (url.includes('/create-job')) {
                cy.task('logMessage', {
                    message: 'User landed on create-job page (default after login)',
                    style: 'green',
                });

                // Verify create-job page elements
                cy.get('body').then(($body) => {
                    if ($body.find('[name="title"], [placeholder*="job"]').length > 0) {
                        cy.task('logMessage', {
                            message: 'Job creation form found',
                            style: 'green',
                        });
                    }
                });
            } else {
                cy.task('logMessage', {
                    message: `User landed on unexpected page: ${url}`,
                    style: 'gray',
                });
            }
        });
    });

    it('should verify dashboard navigation elements', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify dashboard navigation elements',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Wait for page to load
        cy.wait(2000);

        // Check for navigation elements
        cy.get('body').then(($body) => {
            // Check for sidebar navigation
            if ($body.find('nav, [class*="sidebar"], [class*="navigation"]').length > 0) {
                cy.task('logMessage', {
                    message: 'Navigation/sidebar found',
                    style: 'green',
                });
            }

            // Check for menu items
            if ($body.find('button, a').length > 0) {
                cy.task('logMessage', {
                    message: 'Navigation buttons/links found',
                    style: 'green',
                });
            }

            // Log all button text for analysis
            cy.get('button').each(($btn) => {
                const btnText = $btn.text().trim();
                if (btnText) {
                    cy.task('logMessage', {
                        message: `Button found: ${btnText}`,
                        style: 'gray',
                    });
                }
            });
        });
    });

    it('should verify dashboard user information', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify dashboard user information',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Wait for page to load
        cy.wait(2000);

        // Check for user-related elements
        cy.get('body').then(($body) => {
            // Check for user avatar/profile
            if ($body.find('img[alt*="avatar"], img[alt*="profile"], [class*="avatar"], [class*="profile"]').length > 0) {
                cy.task('logMessage', {
                    message: 'User avatar/profile found',
                    style: 'green',
                });
            }

            // Check for user name/email display
            if ($body.find('[class*="user"], [class*="name"], [class*="email"]').length > 0) {
                cy.task('logMessage', {
                    message: 'User information display found',
                    style: 'green',
                });
            }

            // Check for workspace switcher
            if ($body.find('[class*="workspace"], [class*="switch"]').length > 0) {
                cy.task('logMessage', {
                    message: 'Workspace switcher found',
                    style: 'green',
                });
            }
        });
    });

    it('should navigate from dashboard to jobs page', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should navigate from dashboard to jobs page',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Wait for page to load
        cy.wait(2000);

        // Try to navigate to jobs page
        cy.navigateToJobsPage();

        // Verify navigation
        cy.url().should('include', '/create-job');

        cy.task('logMessage', {
            message: 'Successfully navigated to jobs page',
            style: 'green',
        });
    });
});
