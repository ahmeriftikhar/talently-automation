const loginUrl = Cypress.config('loginUrl');
import { selectors } from '../../support/selectors/selectors';

describe('Fixed Job Creation With Custom Question Tests', () => {
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

it('should create a fixed job with custom questions and coding questions', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create a fixed job with custom questions and coding questions',
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
                duration: '40 - 50 minutes',
                language: '/^English$/',
                askForResume: true,
                resumeRequired: true,
                liveCodingCheckbox: true,
                interviewTranscription: true, //could be true or false for enabling or disabling transcription
                interviewEngine: 'Basic'
            };

            const questionText = [
                'What coding languages are you proficient in?',
                'Describe a challenging coding problem you solved.',
                'How do you approach debugging code?',
                'What color is sun?',
                'What is the capital of France?',
                'Explain the concept of object-oriented programming.',
                'What is your experience with version control systems?',
                'Describe a project where you implemented a complex algorithm.',
                'How do you ensure code quality and maintainability?',
                'What are your thoughts on test-driven development?'
            ];

            cy.task('logMessage', {
                message: `Creating fixed job with resume requirement: ${jobData.title}`,
                style: 'gray',
            });

            // Fill basic job details
            cy.fillBasicFixedJobDetails(jobData);

            // Submit job creation step
            cy.submitJobCreationStep();

            // Navigate to interview configuration
            cy.navigateToCustomizeQuestions();

            //Delete all default questions
            cy.deleteAllDefaultQuestions();

            // Add custom questions
            questionText.forEach((question) => {
                cy.addCustomQuestion(question);
            });

            // Navigate to Coding Question
            cy.navigateToCodingQuestion();

            // Navigate to interview configuration
            cy.navigateToInterviewConfiguration(jobData.interviewTranscription, jobData.interviewEngine);

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
});