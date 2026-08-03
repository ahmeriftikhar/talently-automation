const loginUrl = Cypress.config('loginUrl');
import { selectors } from '../../support/selectors/selectors';

const jobTitles = ['SQA Automation Engineer', 'Software Tester', 'Quality Assurance Engineer'];
const randomTitle = () => jobTitles[Math.floor(Math.random() * jobTitles.length)];

describe('Dynamic Job Creation Tests', () => {
    Cypress.on('uncaught:exception', () => false);

    beforeEach(() => {
        cy.logEnvironmentInfo();
        // loginAsAutomationCompany is self-contained (visits loginUrl, handles cookie consent,
        // logs in) — don't pre-visit here or the extra navigation races the login request.
        cy.loginAsAutomationCompany();
        cy.task('logMessage', { message: 'Starting dynamic job creation test', style: 'green' });
    });

    it('should create and publish a dynamic job (happy path)', () => {
        cy.task('logMessage', { message: 'Test Case: create & publish a dynamic job (happy path)', style: 'blue' });

        cy.openDynamicJobCreation();

        cy.generateJobDescription().then((description) => {
            const jobData = {
                title: randomTitle(),
                description,
                location: 'Remote',
                jobType: 'Full Time',
                interviewTranscription: true,
                interviewEngine: 'Basic',
            };

            cy.fillDynamicJobDetails(jobData);
            cy.submitDynamicJobDetails();

            // AI generates the skill sets asynchronously
            cy.waitForSkillGeneration();
            cy.ensureSkillTopicSelected();

            // Skillset -> Interview Configuration (no coding on the happy path)
            cy.proceedDynamicStep();

            // Interview Configuration -> Summary
            cy.configureDynamicInterview(jobData.interviewTranscription, jobData.interviewEngine);
            cy.proceedDynamicStep();

            // Publish from Summary
            cy.publishDynamicJob();
            cy.extractInterviewLink();
            cy.verifyJobLink();

            cy.task('logMessage', { message: 'Dynamic job created and published successfully', style: 'green' });
        });
    });

    it.only('should create a dynamic job with a custom skill topic, basic instructions and custom questions', () => {
        cy.task('logMessage', { message: 'Test Case: dynamic job with custom topic, instructions & questions', style: 'blue' });

        cy.openDynamicJobCreation();

        cy.generateJobDescription().then((description) => {
            const jobData = {
                title: randomTitle(),
                description,
                location: 'Hybrid',
                jobType: 'Full Time',
                askForResume: true,
                resumeRequired: true,
                interviewTranscription: true,
                interviewEngine: 'Basic',
            };

            const customQuestions = [
                'Describe a challenging automation problem you solved.',
                'How do you decide what to automate versus test manually?',
            ];

            cy.fillDynamicJobDetails(jobData);
            cy.submitDynamicJobDetails();

            cy.waitForSkillGeneration();

            // Add a custom skill topic to the first skill accordion
            cy.addSkillTopic('Cypress End-to-End Testing');

            // Add custom must-ask questions
            customQuestions.forEach((q) => cy.addDynamicCustomQuestion(q));

            // Fill the optional Basic Instructions
            cy.fillBasicInstructions({
                expectations: 'Strong communicator, detail-oriented, pragmatic about test coverage.',
                redFlags: 'Only recites buzzwords without concrete examples.',
                customInstructions: 'Probe for real hands-on automation experience.',
            });

            cy.ensureSkillTopicSelected();
            cy.proceedDynamicStep();

            cy.configureDynamicInterview(jobData.interviewTranscription, jobData.interviewEngine);
            cy.proceedDynamicStep();

            cy.publishDynamicJob();
            cy.extractInterviewLink();
            cy.verifyJobLink();

            cy.task('logMessage', { message: 'Dynamic job with custom topic/instructions/questions published', style: 'green' });
        });
    });

    it('should reach the coding-questions step when live coding is enabled', () => {
        cy.task('logMessage', { message: 'Test Case: dynamic job reaches the coding step', style: 'blue' });

        cy.openDynamicJobCreation();

        // The live-coding checkbox (and coding tab) only exist when the coding feature flag is on.
        cy.get('body').then(($b) => {
            if ($b.find(selectors.dynamicJob.liveCodingCheckbox).length === 0) {
                cy.task('logMessage', { message: 'Live-coding feature not enabled in this environment — skipping', style: 'yellow' });
                return;
            }

            cy.generateJobDescription().then((description) => {
                const jobData = {
                    title: randomTitle(),
                    description,
                    location: 'Remote',
                    jobType: 'Full Time',
                    liveCoding: true,
                };

                cy.fillDynamicJobDetails(jobData);
                cy.submitDynamicJobDetails();

                cy.waitForSkillGeneration();
                cy.ensureSkillTopicSelected();

                // Skillset -> Coding step (present because have_coding_questions is set)
                cy.proceedDynamicStep();

                cy.get(selectors.dynamicJob.codingHeading, { timeout: 20000 }).should('be.visible');
                cy.task('logMessage', { message: 'Coding-questions step reached and rendered', style: 'green' });
            });
        });
    });

    it('should show validation errors when submitting empty dynamic job details', () => {
        cy.task('logMessage', { message: 'Test Case: required-field validation on dynamic job details', style: 'blue' });

        cy.openDynamicJobCreation();

        // Proceed without filling anything — yup blocks submit and shows inline errors, no network call.
        cy.get(selectors.dynamicJob.proceedButton).click();
        cy.get(selectors.dynamicJob.validationError, { timeout: 10000 }).should('be.visible');
        cy.url().should('include', '/dynamic-interview'); // stayed on Job Details

        cy.task('logMessage', { message: 'Required-field validation working on dynamic job details', style: 'green' });
    });

    it('should reject a too-short title and description on dynamic job details', () => {
        cy.task('logMessage', { message: 'Test Case: min-length validation on title/description', style: 'blue' });

        cy.openDynamicJobCreation();

        // Title < 4 chars and description < 30 chars are both invalid
        cy.get(selectors.dynamicJob.jobTitleInput).clear().type('QA');
        cy.get(selectors.dynamicJob.jobDescriptionEditor).first().click().clear().type('too short');
        cy.get(selectors.dynamicJob.jobLocationRemote).click();

        cy.get(selectors.dynamicJob.proceedButton).click();

        cy.get(selectors.dynamicJob.validationError, { timeout: 10000 }).should('be.visible');
        cy.url().should('include', '/dynamic-interview');

        cy.task('logMessage', { message: 'Min-length validation working on dynamic job details', style: 'green' });
    });
});
