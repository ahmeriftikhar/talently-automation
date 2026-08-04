import { selectors } from '../../support/selectors/selectors';

/**
 * Full dynamic-interview journey (end to end):
 *   1. Log in as the company and create a DYNAMIC job with ALL customizations EXCEPT coding:
 *        - job details (resume required)
 *        - AI-generated skillset + a custom skill topic
 *        - custom must-ask questions
 *        - basic instructions (expectations / red flags / custom instructions)
 *      Live coding is intentionally NOT enabled, so there is no coding step and the interview is
 *      purely conversational.
 *   2. Publish the job and extract the candidate interview link.
 *   3. Reset the browser session (so the candidate flow starts fresh, not as the logged-in company)
 *      and conduct the interview (self-answering flow; resume upload since resume is required).
 *
 * NOTE: this publishes a REAL job and runs a full AI interview, so it is long-running.
 */
const jobTitles = ['SQA Automation Engineer', 'Software Tester', 'Quality Assurance Engineer'];
const randomTitle = () => jobTitles[Math.floor(Math.random() * jobTitles.length)];

describe('Dynamic Interview Journey (all customizations, no coding)', () => {
    Cypress.on('uncaught:exception', () => false);

    beforeEach(() => {
        cy.logEnvironmentInfo();
        // loginAsAutomationCompany is self-contained (visits loginUrl, handles cookie consent, logs in).
        cy.loginAsAutomationCompany();
        cy.task('logMessage', { message: 'Starting dynamic interview journey test', style: 'green' });
    });

    it('should create a fully-customized dynamic job (no coding), then conduct the interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Create a dynamic job (all customizations, no coding) and conduct the interview',
            style: 'blue',
        });

        cy.openDynamicJobCreation();

        cy.generateJobDescription().then((description) => {
            const jobData = {
                // Optional overrides from the workflow (CYPRESS_JOB_TITLE / _DESCRIPTION), with
                // built-in fallbacks. Interview duration is not set at creation for dynamic jobs.
                title: Cypress.env('JOB_TITLE') || randomTitle(),
                description: Cypress.env('JOB_DESCRIPTION') || description,
                location: 'Hybrid',
                jobType: 'Full Time',
                askForResume: true,
                resumeRequired: true,
                interviewTranscription: true,
                interviewEngine: 'Basic',
                // liveCoding intentionally omitted — no coding step in this journey
            };

            const customQuestions = [
                'Describe a challenging automation problem you solved.',
                'How do you decide what to automate versus test manually?',
            ];

            // --- Job details ---
            cy.fillDynamicJobDetails(jobData);
            cy.submitDynamicJobDetails();

            // --- Skillset (AI-generated) + customizations ---
            cy.waitForSkillGeneration();
            cy.addSkillTopic('Cypress End-to-End Testing');
            // The AI pre-selects ~2 topics in EVERY generated skill. Clear them across ALL skills
            // (keeping our custom topic), then pick 2 more topics from random distinct skills — so
            // the final selection is exactly 3 topics total (the custom one + 2), spread across skills.
            cy.deselectAllSkillTopics('Cypress End-to-End Testing');
            cy.selectRandomSkillTopics(2);
            // Confirm exactly 3 topics are selected across ALL skills (custom + 2).
            cy.verifyTotalSelectedTopics(3);
            customQuestions.forEach((q) => cy.addDynamicCustomQuestion(q));
            cy.fillBasicInstructions({
                expectations: 'Strong communicator, detail-oriented, pragmatic about test coverage.',
                redFlags: 'Only recites buzzwords without concrete examples.',
                customInstructions: 'Probe for real hands-on automation experience.',
            });
            cy.ensureSkillTopicSelected();

            // Skillset -> Interview Configuration (no coding step)
            cy.proceedDynamicStep();

            // Interview Configuration -> Summary
            cy.configureDynamicInterview(jobData.interviewTranscription, jobData.interviewEngine);
            cy.proceedDynamicStep();

            // --- Publish + extract link ---
            cy.publishDynamicJob();
            cy.extractInterviewLink();
            cy.verifyJobLink();

            cy.task('logMessage', {
                message: 'Dynamic job (no coding) created and published — starting the interview',
                style: 'green',
            });

            // Reset the browser state so the candidate flow starts fresh. Without this, the same
            // (company) session carries over and the interview link skips candidate registration —
            // jumping straight to the resume screen — which breaks the candidate flow.
            cy.get('@candidateInterviewLink').then((interviewLink) => {
                cy.clearCookies();
                cy.clearLocalStorage();
                cy.clearAllSessionStorage();

                // Conduct the interview on the freshly published link as a brand-new candidate
                cy.interviewWithoutJobCreation(interviewLink);
            });

            cy.task('logMessage', {
                message: 'Dynamic interview journey completed successfully',
                style: 'green',
            });
        });
    });
});
