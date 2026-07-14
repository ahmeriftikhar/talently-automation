const loginUrl = Cypress.config('loginUrl');

describe('Job Creation Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting job creation test',
            style: 'green',
        });
    });

    it('should create a job with fixed questions', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create a job with fixed questions',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to job creation
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Generate job description
        cy.generateJobDescription().then((jobDescription) => {
            const jobTitle = 'SQA Automation Engineer';
            const jobType = 'Full-time';

            cy.task('logMessage', {
                message: `Creating job: ${jobTitle}`,
                style: 'gray',
            });

            // Fill basic job details
            cy.fillBasicFixedJobDetails({
                title: jobTitle,
                description: jobDescription,
                jobType: jobType
            });

            // Submit the job creation
            cy.submitCurrentFooterStep('createJob');

            // Publish the job
            cy.publishCurrentJob();

            // Extract and verify interview link
            cy.extractPublishedInterviewLink();

            cy.task('logMessage', {
                message: 'Job created and published successfully',
                style: 'green',
            });
        });
    });

    it('should validate required fields in job creation', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should validate required fields in job creation',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to job creation
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Try to submit without filling required fields
        cy.submitCurrentFooterStep();

        // Verify validation errors are shown
        cy.get('.text-xs.text-red-500').should('be.visible');

        cy.task('logMessage', {
            message: 'Required field validation working correctly',
            style: 'green',
        });
    });

    it('should navigate between job creation steps', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should navigate between job creation steps',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to job creation
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Verify we're on job creation page
        cy.url().should('include', '/add-job');

        cy.task('logMessage', {
            message: 'Successfully navigated to job creation page',
            style: 'green',
        });
    });
});
