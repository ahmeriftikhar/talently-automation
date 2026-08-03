const loginUrl = Cypress.config('loginUrl');
import { selectors } from '../../support/selectors/selectors';

/**
 * Full fixed-interview journey (end to end):
 *   1. Log in as the company and create a FIXED job with custom questions — the same flow as
 *      create-jobs/fixedJobCreationWithCustomQuestions.cy.js, but with LIVE CODING DISABLED
 *      (so there is no coding step and the interview is purely conversational).
 *   2. Publish the job and extract the candidate interview link.
 *   3. Open that link and conduct the interview (self-answering flow, resume upload if required).
 *
 * NOTE: this publishes a REAL job and runs a full AI interview, so it is long-running.
 */
describe('Fixed Interview Journey (custom questions, no coding)', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.visit(loginUrl);
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting fixed interview journey test',
            style: 'green',
        });
    });

    it('should create a fixed job with custom questions (no coding), then conduct the interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Create a fixed job (custom questions, no coding) and conduct the interview',
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
            const jobTitles = ['SQA Automation Engineer', 'Software Tester', 'Quality Assurance Engineer'];
            const jobData = {
                title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
                description: jobDescription,
                location: 'Hybrid',
                jobType: 'Full Time',
                // 20-30 keeps the interview shorter than the 40-50 used by the creation-only spec.
                duration: '20 - 30 minutes',
                language: '/^English$/',
                askForResume: true,
                resumeRequired: true,
                liveCodingCheckbox: false, // coding disabled — the key difference from fixedJobCreationWithCustomQuestions
                interviewTranscription: true, // could be true or false for enabling/disabling transcription
                interviewEngine: 'Basic',
            };

            const questionText = [
                'What programming languages are you proficient in?',
                'Describe a challenging problem you solved recently.',
                'How do you approach debugging an issue?',
                'What color is the sun?',
                'What is the capital of France?',
                'Explain the concept of object-oriented programming.',
                'What is your experience with version control systems?',
                'Describe a project where you implemented a complex feature.',
                'How do you ensure code quality and maintainability?',
                'What are your thoughts on test-driven development?',
            ];

            cy.task('logMessage', {
                message: `Creating fixed job (no coding): ${jobData.title}`,
                style: 'gray',
            });

            // Fill basic job details
            cy.fillBasicFixedJobDetails(jobData);

            // Submit job creation step
            cy.submitJobCreationStep();

            // Navigate to the customize-questions step
            cy.navigateToCustomizeQuestions();

            // Delete all default questions
            cy.deleteAllDefaultQuestions();

            // Add custom questions
            questionText.forEach((question) => {
                cy.addCustomQuestion(question);
            });

            // No coding step (coding disabled) — go straight to interview configuration
            cy.navigateToInterviewConfiguration(jobData.interviewTranscription, jobData.interviewEngine);

            // Navigate to summary
            cy.navigateToSummary();

            // Publish the job
            cy.publishJob();

            // Extract interview link (sets @candidateInterviewLink)
            cy.extractInterviewLink();

            // Verify the link is reachable
            cy.verifyJobLink();

            cy.task('logMessage', {
                message: 'Fixed job (no coding) created and published — starting the interview',
                style: 'green',
            });

            // Conduct the interview on the freshly published link
            cy.get('@candidateInterviewLink').then((interviewLink) => {
                cy.interviewWithoutJobCreation(interviewLink);
            });

            cy.task('logMessage', {
                message: 'Fixed interview journey completed successfully',
                style: 'green',
            });
        });
    });
});
