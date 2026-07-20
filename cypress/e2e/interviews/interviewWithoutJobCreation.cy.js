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

    it.only('should complete interview without job creation using provided link', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should complete interview without job creation using provided link',
            style: 'blue',
        });

        // Hardcoded interview link as requested - can be changed by management
        const interviewLink = Cypress.env('interviewLink') || 'https://develop.d2n5cdf1ckgvym.amplifyapp.com/interview/6a2fb0204c57fbdada62db12';
        
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

    it('should handle inactivity modal during interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should handle inactivity modal during interview',
            style: 'blue',
        });

        const interviewLink = Cypress.env('interviewLink') || 'https://develop.d2n5cdf1ckgvym.amplifyapp.com/interview/6a2fb0204c57fbdada62db12';
        
        cy.task('logMessage', {
            message: `Using interview link: ${interviewLink}`,
            style: 'gray',
        });

        // Execute interview without job creation
        cy.interviewWithoutJobCreation(interviewLink);

        cy.task('logMessage', {
            message: 'Interview with inactivity handling completed successfully',
            style: 'green',
        });
    });

    it('should handle termination box during interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should handle termination box during interview',
            style: 'blue',
        });

        const interviewLink = Cypress.env('interviewLink') || 'https://develop.d2n5cdf1ckgvym.amplifyapp.com/interview/6a2fb0204c57fbdada62db12';
        
        cy.task('logMessage', {
            message: `Using interview link: ${interviewLink}`,
            style: 'gray',
        });

        // Execute interview without job creation
        cy.interviewWithoutJobCreation(interviewLink);

        cy.task('logMessage', {
            message: 'Interview with termination box handling completed successfully',
            style: 'green',
        });
    });

    it('should verify interview completion message', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify interview completion message',
            style: 'blue',
        });

        const interviewLink = Cypress.env('interviewLink') || 'https://develop.d2n5cdf1ckgvym.amplifyapp.com/interview/6a2fb0204c57fbdada62db12';
        
        cy.task('logMessage', {
            message: `Using interview link: ${interviewLink}`,
            style: 'gray',
        });

        // Execute interview without job creation
        cy.interviewWithoutJobCreation(interviewLink);

        // Verify completion message appears
        cy.contains(selectors.interview.completedMessage, { timeout: 30000 }).should('be.visible');

        cy.task('logMessage', {
            message: 'Interview completion message verified successfully',
            style: 'green',
        });
    });
});
