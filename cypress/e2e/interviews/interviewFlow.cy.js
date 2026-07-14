const loginUrl = Cypress.config('loginUrl');

describe('Interview Flow Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting interview flow test',
            style: 'green',
        });
    });

    it('should complete interview journey from job creation to candidate interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should complete interview journey from job creation to candidate interview',
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
            const jobTitle = 'Software Engineer';
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

            // Extract interview link
            cy.extractPublishedInterviewLink();

            // Get the interview link and visit as candidate
            cy.get('@candidateInterviewLink').then((interviewLink) => {
                cy.task('logMessage', {
                    message: `Interview link: ${interviewLink}`,
                    style: 'gray',
                });

                // Visit interview link as candidate
                cy.visit(interviewLink);

                // Fill candidate details
                cy.fixture('userAccounts.json').then((users) => {
                    const candidate = users.candidateUser;

                    cy.fillCandidateDetails({
                        name: candidate.name,
                        email: candidate.email,
                        country: candidate.country,
                        phone: candidate.phone
                    });

                    // Accept terms
                    cy.acceptCandidateTerms();

                    // Proceed to interview
                    cy.proceedToInterview();

                    cy.task('logMessage', {
                        message: 'Candidate registered successfully',
                        style: 'green',
                    });
                });
            });
        });
    });

    it('should validate candidate registration fields', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should validate candidate registration fields',
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
            const jobTitle = 'QA Engineer';
            const jobType = 'Full-time';

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

            // Extract interview link
            cy.extractPublishedInterviewLink();

            // Get the interview link and visit as candidate
            cy.get('@candidateInterviewLink').then((interviewLink) => {
                cy.visit(interviewLink);

                // Try to proceed without filling fields
                cy.get('#proceed-interview-click-candidate').click();

                // Verify validation errors
                cy.get('.text-xs.text-red-500').should('be.visible');

                cy.task('logMessage', {
                    message: 'Candidate field validation working correctly',
                    style: 'green',
                });
            });
        });
    });
});
