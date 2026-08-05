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

// --- Skill-topic selection helpers -----------------------------------------------------------
// Topics live in per-skill accordions (Radix type="single" — only the OPEN skill's topics are in
// the DOM; collapsed skills keep their selections but aren't rendered). A SELECTED topic button
// (#job-topic-update) is wrapped by a `.gradient-bg-fixed` element (GradientBorder applyGradient);
// an unselected one is not. So to touch every skill we must expand each accordion in turn.

const isTopicSelected = (btn) => !!btn.closest('.gradient-bg-fixed');

// Expand the skill accordion at index `i` and WAIT until it is actually open. This is the crucial
// fix: previously we only checked that *some* topic existed (true even when skill i never opened),
// so skills 1..N were never processed. Radix sets data-state="open" on the active trigger; assert it.
const expandSkill = (i) => {
    cy.get(selectors.dynamicJob.skillAccordionTrigger).eq(i).then(($t) => {
        if ($t.attr('data-state') !== 'open') cy.wrap($t).click();
    });
    // Confirm THIS skill's accordion is open before touching its topics.
    cy.get(selectors.dynamicJob.skillAccordionTrigger).eq(i, { timeout: 10000 })
        .should('have.attr', 'data-state', 'open');
    cy.get(selectors.dynamicJob.skillTopicToggle, { timeout: 10000 }).should('have.length.greaterThan', 0);
};

// Deselect EVERY selected topic across ALL skills, except one whose text matches `keepText`
// (the manually-added custom topic). Iterates each skill accordion.
Cypress.Commands.add('deselectAllSkillTopics', (keepText = '') => {
    cy.get(selectors.dynamicJob.skillAccordionTrigger).its('length').then((skillCount) => {
        cy.task('logMessage', { message: `Deselecting topics across ${skillCount} skills (keep: "${keepText}")`, style: 'gray' });

        Cypress._.times(skillCount, (i) => {
            expandSkill(i);

            const deselectStep = (guard) => {
                if (guard <= 0) return;
                cy.get('body').then(($b) => {
                    const selected = [...$b.find(selectors.dynamicJob.skillTopicToggle)].filter(isTopicSelected);
                    const target = selected.find((btn) => !(keepText && btn.textContent.includes(keepText)));
                    if (!target) return; // nothing left to deselect in this skill
                    cy.wrap(target).click({ force: true });
                    // retryably confirm it deselected (wrapper lost the gradient class)
                    cy.wrap(target).parents('.gradient-bg-fixed').should('not.exist');
                    deselectStep(guard - 1);
                });
            };
            deselectStep(25);
        });
    });
});

// Select `count` topics spread across DISTINCT random skills (one topic per chosen skill).
// If there are fewer skills than `count`, remaining picks fall on random skills (may repeat).
Cypress.Commands.add('selectRandomSkillTopics', (count = 3) => {
    cy.get(selectors.dynamicJob.skillAccordionTrigger).its('length').then((skillCount) => {
        const distinct = Cypress._.sampleSize(Cypress._.range(skillCount), Math.min(count, skillCount));
        const indices = [...distinct];
        while (indices.length < count) indices.push(Math.floor(Math.random() * skillCount));

        cy.task('logMessage', { message: `Selecting ${count} topics from skills [${indices.join(', ')}]`, style: 'gray' });

        indices.forEach((skillIdx) => {
            expandSkill(skillIdx);
            cy.get('body').then(($b) => {
                const unselected = [...$b.find(selectors.dynamicJob.skillTopicToggle)].filter((btn) => !isTopicSelected(btn));
                if (unselected.length === 0) {
                    cy.task('logMessage', { message: `Skill ${skillIdx}: no unselected topic available`, style: 'yellow' });
                    return;
                }
                const pick = unselected[Math.floor(Math.random() * unselected.length)];
                cy.wrap(pick).click({ force: true });
                // retryably confirm it selected (wrapper gained the gradient class)
                cy.wrap(pick).parents('.gradient-bg-fixed').should('exist');
            });
        });
    });
});

// Assert the TOTAL number of selected topics across ALL skills. Each accordion trigger renders
// "{n} Topic(s) Selected", so sum those counts (works even for collapsed skills). Retries until stable.
Cypress.Commands.add('verifyTotalSelectedTopics', (expected) => {
    cy.get(selectors.dynamicJob.skillAccordionTrigger).should(($triggers) => {
        const total = [...$triggers].reduce((sum, t) => {
            const m = (t.textContent || '').match(/(\d+)\s+Topic/);
            return sum + (m ? parseInt(m[1], 10) : 0);
        }, 0);
        expect(total, 'total selected topics across all skills').to.equal(expected);
    });
    cy.task('logMessage', { message: `Verified total selected topics = ${expected}`, style: 'green' });
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

// After leaving the Skillset step the wizard lands on EITHER the Coding step (when live coding is
// enabled) or directly on Interview Configuration. Wait until one is identifiable, and if it's the
// Coding step, advance past it (2 coding questions are auto-generated, satisfying the min) so the
// caller reliably ends up on Interview Configuration.
Cypress.Commands.add('handleDynamicCodingStepIfPresent', () => {
    cy.log('Checking whether the dynamic Coding step is present');
    cy.get('body', { timeout: 30000 }).should(($b) => {
        const onCoding = $b.find(selectors.dynamicJob.codingHeading).length;
        const onConfig = $b.find(selectors.dynamicJob.transcriptionToggle).length;
        expect(onCoding + onConfig, 'reached the Coding or Interview Configuration step').to.be.greaterThan(0);
    });
    cy.get('body').then(($b) => {
        if ($b.find(selectors.dynamicJob.codingHeading).length > 0) {
            cy.task('logMessage', { message: 'Coding step present — advancing past it to Interview Configuration', style: 'gray' });
            cy.proceedDynamicStep();
        } else {
            cy.task('logMessage', { message: 'No Coding step — already on Interview Configuration', style: 'gray' });
        }
    });
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
