const loginUrl = Cypress.config('loginUrl');
import { selectors } from '../../support/selectors/selectors';

describe('Fixed Job Creation Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting fixed job creation test',
            style: 'green',
        });
    });

    it.only('should create a fixed job with all required fields', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create a fixed job with all required fields',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to jobs page
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Generate job description
        cy.generateJobDescription().then((jobDescription) => {
            const jobData = {
                title: 'SQA Automation Engineer',
                description: jobDescription,
                location: 'Remote',
                jobType: 'Full-time',
                duration: '10 minutes',
                language: 'English',
                askForResume: false
            };

            cy.task('logMessage', {
                message: `Creating fixed job: ${jobData.title}`,
                style: 'gray',
            });

            // Fill basic job details
            cy.fillBasicFixedJobDetails(jobData);

            // Submit job creation step
            cy.submitJobCreationStep();

            // Wait for navigation to next step
            cy.wait(2000);

            // Navigate to interview configuration
            cy.navigateToCustomizeQuestions();

            // Wait for questions to load
            cy.wait(2000);

            // Navigate to interview configuration
            cy.navigateToInterviewConfiguration();

            // Navigate to summary
            cy.navigateToSummary();

            // Publish the job
            cy.publishJob();

            // Extract interview link
            cy.extractInterviewLink();

            // Verify job link is working
            cy.verifyJobLink();

            cy.task('logMessage', {
                message: 'Fixed job created and published successfully',
                style: 'green',
            });
        });
    });

    it('should create a fixed job with resume requirement', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create a fixed job with resume requirement',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to jobs page
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Generate job description
        cy.generateJobDescription().then((jobDescription) => {
            const jobData = {
                title: 'Software Developer',
                description: jobDescription,
                location: 'Hybrid',
                jobType: 'Full-time',
                duration: '15 minutes',
                language: 'English',
                askForResume: true,
                resumeRequired: true
            };

            cy.task('logMessage', {
                message: `Creating fixed job with resume requirement: ${jobData.title}`,
                style: 'gray',
            });

            // Fill basic job details
            cy.fillBasicFixedJobDetails(jobData);

            // Submit job creation step
            cy.submitJobCreationStep();

            // Wait for navigation to next step
            cy.wait(2000);

            // Navigate to interview configuration
            cy.navigateToCustomizeQuestions();

            // Navigate to interview configuration
            cy.navigateToInterviewConfiguration();

            // Navigate to summary
            cy.navigateToSummary();

            // Publish the job
            cy.publishJob();

            // Extract interview link
            cy.extractInterviewLink();

            // Verify job link is working
            cy.verifyJobLink();

            cy.task('logMessage', {
                message: 'Fixed job with resume requirement created successfully',
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

        // Navigate to jobs page
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Try to submit without filling required fields
        cy.get(selectors.jobs.proceedButton).click();

        // Verify validation errors are shown
        cy.get('.text-xs.text-red-500').should('be.visible');

        cy.task('logMessage', {
            message: 'Required field validation working correctly',
            style: 'green',
        });
    });

    it('should create a fixed job with different location types', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create a fixed job with different location types',
            style: 'blue',
        });

        // Login as company user
        cy.loginAsAutomationCompany();

        // Navigate to jobs page
        cy.navigateToJobsPage();

        // Open fixed job creation
        cy.openFixedJobCreation();

        // Generate job description
        cy.generateJobDescription().then((jobDescription) => {
            const locations = ['Remote', 'Hybrid', 'Onsite'];
            
            locations.forEach((location, index) => {
                cy.task('logMessage', {
                    message: `Testing location: ${location}`,
                    style: 'gray',
                });

                const jobData = {
                    title: `Test Engineer ${index + 1}`,
                    description: jobDescription,
                    location: location,
                    jobType: 'Full-time',
                    duration: '10 minutes',
                    language: 'English',
                    askForResume: false
                };

                // Fill basic job details
                cy.fillBasicFixedJobDetails(jobData);

                // Submit job creation step
                cy.submitJobCreationStep();

                // Navigate to interview configuration
                cy.navigateToCustomizeQuestions();
                cy.navigateToInterviewConfiguration();
                cy.navigateToSummary();

                // Publish the job
                cy.publishJob();

                // Extract and verify link
                cy.extractInterviewLink();
                cy.verifyJobLink();

                // Navigate back to create new job
                cy.visit('/create-job');
                cy.openFixedJobCreation();
            });

            cy.task('logMessage', {
                message: 'Fixed jobs with different location types created successfully',
                style: 'green',
            });
        });
    });
});
