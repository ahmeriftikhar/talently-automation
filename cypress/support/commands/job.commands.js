import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

Cypress.Commands.add('openFixedJobCreation', () => {
    cy.log('Opening fixed job creation');
    
    // Navigate to jobs listing page first
    cy.visit('/create-job');
    cy.wait(3000);
    
    // Click Add Job button to show modal
    cy.log('Clicking Add Job button on job listing page');
    cy.get(selectors.jobs.addJobButton).click();
    
    // Wait for modal to appear
    cy.wait(2000);
    
    // Click on Fixed questions from modal
    cy.log('Selecting Fixed questions option');
    cy.contains('Fixed questions', { timeout: 10000 }).click();
    cy.url().should('include', '/add-job');
});

Cypress.Commands.add('fillBasicFixedJobDetails', (jobData) => {
    cy.log('Filling basic job details');
    
    // Fill job title
    cy.get(selectors.jobs.jobTitleInput).clear().type(jobData.title);
    
    // Fill job description
    cy.get(selectors.jobs.jobDescriptionEditor).clear().type(jobData.description);
    
    // Select job location
    if (jobData.location) {
        switch(jobData.location.toLowerCase()) {
            case 'remote':
                cy.get(selectors.jobs.jobLocationRemote).click();
                break;
            case 'hybrid':
                cy.get(selectors.jobs.jobLocationHybrid).click();
                break;
            case 'onsite':
                cy.get(selectors.jobs.jobLocationOnsite).click();
                break;
            default:
                cy.get(selectors.jobs.jobLocationRemote).click();
        }
    } else {
        cy.get(selectors.jobs.jobLocationRemote).click();
    }
    
    // Select job type
    cy.get(selectors.jobs.jobTypeSelect).click();
    cy.contains(jobData.jobType || 'Full-time').click();
    
    // Select interview duration
    if (jobData.duration) {
        cy.get(selectors.jobs.interviewDurationSelect).click();
        cy.contains(jobData.duration).click();
    }
    
    // Select interview language
    if (jobData.language) {
        cy.get(selectors.jobs.interviewLanguageSelect).click();
        cy.contains(jobData.language).click();
    }
    
    // Handle resume options if specified
    if (jobData.askForResume) {
        cy.get(selectors.jobs.askForResumeCheckbox).check();
        if (jobData.resumeRequired) {
            cy.get(selectors.jobs.resumeRequired).click();
        } else {
            cy.get(selectors.jobs.resumeOptional).click();
        }
    }
});

Cypress.Commands.add('submitJobCreationStep', () => {
    cy.log('Submitting job creation step');
    cy.get(selectors.jobs.proceedButton).click();
});

Cypress.Commands.add('navigateToCustomizeQuestions', () => {
    cy.log('Navigating to customize questions tab');
    cy.get(selectors.jobs.customizeQuestionsTab).click();
});

Cypress.Commands.add('navigateToInterviewConfiguration', () => {
    cy.log('Navigating to interview configuration tab');
    cy.get(selectors.jobs.interviewConfigTab).click();
});

Cypress.Commands.add('navigateToSummary', () => {
    cy.log('Navigating to summary tab');
    cy.get(selectors.jobs.summaryTab).click();
});

Cypress.Commands.add('publishJob', () => {
    cy.log('Publishing job');
    cy.intercept('POST', `${backendUrl()}/job/*/publish`).as('publishJob');
    cy.get(selectors.jobs.publishButton).click();
    cy.wait('@publishJob').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        const jobId = interception.request.url.match(/\/job\/([^/]+)\/publish/)?.[1];
        expect(jobId, 'published job id').to.be.a('string').and.not.be.empty;
        cy.wrap(jobId).as('publishedJobId');
    });
});

Cypress.Commands.add('extractInterviewLink', () => {
    cy.log('Extracting interview link');
    cy.get('@publishedJobId').then((jobId) => {
        const expectedPath = `/interview/${jobId}`;
        cy.contains(expectedPath, { timeout: 60000 }).should('be.visible');
        cy.location('origin').then((origin) => {
            cy.wrap(`${origin}${expectedPath}`).as('candidateInterviewLink');
            cy.task('logMessage', {
                message: `Interview link extracted: ${origin}${expectedPath}`,
                style: 'green',
            });
        });
    });
});

Cypress.Commands.add('verifyJobLink', () => {
    cy.log('Verifying job link');
    cy.get('@candidateInterviewLink').then((link) => {
        cy.request(link).its('status').should('eq', 200);
        cy.task('logMessage', {
            message: 'Job link verified successfully',
            style: 'green',
        });
    });
});
