import { selectors } from '../../support/selectors/selectors';

describe('Interview Without Job Creation Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.task('logMessage', {
            message: 'Starting interview without job creation test',
            style: 'green',
        });
    });

    it('should complete interview without job creation using provided link', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should complete interview without job creation using provided link',
            style: 'blue',
        });

        // Hardcoded interview link as requested - can be changed by management
        const interviewLink = Cypress.env('interviewLink')
            || (Cypress.env('environment') === 'prod'
                ? 'https://interview.talently.ai/interview/6a6738c31bdf087868ae802c'
                : 'https://develop.d2n5cdf1ckgvym.amplifyapp.com/interview/6a6a074157cebb557500737c');        
                cy.task('logMessage', {
                    message: `Using interview link: ${interviewLink}`,
                    style: 'gray',
                });

        // Execute interview without job creation
        cy.interviewWithoutJobCreation(interviewLink);

        cy.task('logMessage', {
            message: 'Interview completed successfully',
            style: 'green',
        });
    });
});
