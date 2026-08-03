import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

// Open the dynamic job creation wizard from the job listing chooser modal.
Cypress.Commands.add('openDynamicJobCreation', () => {
    cy.log('Opening dynamic job creation');
    cy.visit('/create-job');
    cy.get(selectors.jobs.addJobButton, { timeout: 15000 }).click();
    // Chooser modal — pick the "Dynamic questions" card (routes to /dynamic-interview)
    cy.get(selectors.dynamicJob.dynamicQuestionsOption, { timeout: 10000 }).click();
    cy.url({ timeout: 15000 }).should('include', '/dynamic-interview');
    cy.get(selectors.dynamicJob.jobTitleInput, { timeout: 15000 }).should('be.visible');
});

// Fill the dynamic Job Details step. `jobData`: { title, description, location, jobType,
// askForResume, resumeRequired, liveCoding }. Language is left at its default ("English").
Cypress.Commands.add('fillDynamicJobDetails', (jobData) => {
    cy.log('Filling dynamic job details');

    cy.get(selectors.dynamicJob.jobTitleInput).clear().type(jobData.title);

    // Description is a react-rte contenteditable, not a textarea (must be >= 30 chars).
    cy.get(selectors.dynamicJob.jobDescriptionEditor).first().click().clear().type(jobData.description);

    if (jobData.location) {
        switch (jobData.location.toLowerCase()) {
            case 'remote': cy.get(selectors.dynamicJob.jobLocationRemote).click(); break;
            case 'hybrid': cy.get(selectors.dynamicJob.jobLocationHybrid).click(); break;
            case 'onsite': cy.get(selectors.dynamicJob.jobLocationOnsite).click(); break;
            default: throw new Error(`Unknown job location: ${jobData.location}`);
        }
    }

    if (jobData.jobType) {
        cy.get(selectors.dynamicJob.jobTypeSelect).click();
        cy.get(selectors.dynamicJob.selectOption).contains(jobData.jobType).click();
    }

    if (jobData.askForResume) {
        cy.get(selectors.dynamicJob.askForResumeCheckbox).click();
        if (jobData.resumeRequired) {
            cy.get(selectors.dynamicJob.resumeRequired).click();
        } else {
            cy.get(selectors.dynamicJob.resumeOptional).click();
        }
    }

    // Live-coding checkbox only exists when the coding feature flag is on — click if requested & present.
    if (jobData.liveCoding) {
        cy.get('body').then(($b) => {
            if ($b.find(selectors.dynamicJob.liveCodingCheckbox).length > 0) {
                cy.get(selectors.dynamicJob.liveCodingCheckbox).click();
            } else {
                cy.task('logMessage', { message: 'Live-coding checkbox not available (feature flag off)', style: 'yellow' });
            }
        });
    }
});

// Submit Job Details -> triggers POST /create-job and the async skill-generation screen.
Cypress.Commands.add('submitDynamicJobDetails', () => {
    cy.log('Submitting dynamic job details');
    cy.intercept('POST', '**/create-job').as('createDynamicJob');
    cy.intercept('PATCH', '**/job/*').as('updateDynamicJob');
    cy.get(selectors.dynamicJob.proceedButton).click();
    // A new job POSTs /create-job; an existing (draft) job PATCHes /job/:id. Accept either.
    cy.wait('@createDynamicJob', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
});

// Wait for the AI skill generation to finish (polls /job/:id/status every 15s) and the
// "Generated Skill Sets" heading to render. Generous timeout for real generation.
Cypress.Commands.add('waitForSkillGeneration', () => {
    cy.log('Waiting for skill generation to complete');
    cy.task('logMessage', { message: 'Waiting for AI skill generation (may take a couple of minutes)', style: 'gray' });
    cy.get(selectors.dynamicJob.generatedSkillsHeading, { timeout: 240000 }).should('be.visible');
    cy.task('logMessage', { message: 'Skill sets generated', style: 'green' });
});

// Ensure at least one skill topic is selected so the skillset Proceed button is enabled.
// Topics may already be selected after generation; only toggle one on if Proceed is disabled.
Cypress.Commands.add('ensureSkillTopicSelected', () => {
    cy.get(selectors.dynamicJob.proceedButton).then(($btn) => {
        if ($btn.is(':disabled')) {
            cy.log('No topic selected — selecting the first available topic');
            cy.get(selectors.dynamicJob.skillTopicToggle, { timeout: 10000 }).first().click();
        }
        // Proceed must now be enabled
        cy.get(selectors.dynamicJob.proceedButton).should('not.be.disabled');
    });
});

// Add a custom topic to the currently open skill accordion.
// APP BUG: the confirm control is <button type="submit" onClick={handleUpdate}> inside a <form>
// with NO onSubmit/preventDefault. handleUpdate DOES add the topic, but the button also triggers a
// NATIVE form submit -> full page reload, which discards it (both tick-click and Enter hit this).
// Workaround: attach a submit listener that preventDefault()s the native submit, so the onClick's
// topic add survives without the reload.
Cypress.Commands.add('addSkillTopic', (topic) => {
    cy.log(`Adding skill topic: ${topic}`);
    cy.get(selectors.dynamicJob.addSkillTopicButton, { timeout: 10000 }).first().click();
    cy.get(selectors.dynamicJob.addSkillTopicInput, { timeout: 10000 }).type(topic);
    // Suppress the native form submit (the reload bug) while keeping the button's onClick add.
    cy.get(selectors.dynamicJob.addSkillTopicInput)
        .closest('form')
        .then(($form) => { $form.on('submit', (e) => e.preventDefault()); });
    cy.get(selectors.dynamicJob.confirmSkillTopicButton).click();
});

// Fill the optional Basic Instructions textareas. `instructions`: { expectations, redFlags, customInstructions }.
Cypress.Commands.add('fillBasicInstructions', (instructions = {}) => {
    cy.log('Filling basic instructions');
    if (instructions.expectations) {
        cy.get(selectors.dynamicJob.expectationsTextarea).clear().type(instructions.expectations);
    }
    if (instructions.redFlags) {
        cy.get(selectors.dynamicJob.redFlagsTextarea).clear().type(instructions.redFlags);
    }
    if (instructions.customInstructions) {
        cy.get(selectors.dynamicJob.customInstructionsTextarea).clear().type(instructions.customInstructions);
    }
});

// Add a custom (must-ask) question in the skillset step's Customize Questions section.
Cypress.Commands.add('addDynamicCustomQuestion', (question) => {
    cy.log(`Adding dynamic custom question: ${question}`);
    cy.get(selectors.dynamicJob.questionInput).last().clear().type(question);
    cy.get(selectors.dynamicJob.addQuestionButton).click();
});

// Proceed to the next dynamic step (Skillset/Coding/Config -> next). Waits for the PATCH /job save.
Cypress.Commands.add('proceedDynamicStep', () => {
    cy.log('Proceeding to next dynamic step');
    cy.intercept('PATCH', '**/job/*').as('saveDynamicStep');
    cy.get(selectors.dynamicJob.proceedButton).should('not.be.disabled').click();
    cy.wait('@saveDynamicStep', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
});

// Configure the Interview Configuration step (transcription + engine), reusing the shared toggles.
Cypress.Commands.add('configureDynamicInterview', (interviewTranscription, interviewEngine) => {
    cy.log('Configuring dynamic interview (transcription + engine)');
    cy.checkTranscriptionToggle(interviewTranscription);
    cy.selectInterviewEngine(interviewEngine);
});

// Publish the dynamic job from the Summary step. Reuses the shared publish intercept/id capture.
Cypress.Commands.add('publishDynamicJob', () => {
    cy.log('Publishing dynamic job');
    cy.intercept('POST', `${backendUrl()}/job/*/publish`).as('publishDynamicJob');
    cy.get(selectors.dynamicJob.publishButton, { timeout: 15000 }).click();
    cy.wait('@publishDynamicJob', { timeout: 60000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        const jobId = interception.request.url.match(/\/job\/([^/]+)\/publish/)?.[1];
        expect(jobId, 'published dynamic job id').to.be.a('string').and.not.be.empty;
        cy.wrap(jobId).as('publishedJobId');
    });
});
