import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

Cypress.Commands.add('openFixedJobCreation', () => {
    cy.log('Opening fixed job creation');
    
    // Navigate to jobs listing page first
    cy.visit('/create-job');
    cy.wait(3000);
    
    // Click Add Job button to show modal
    cy.log('Clicking Add Job button on job listing page');
    cy.get(selectors.jobs.addJobButton, { timeout: 5000 }).click();
    
    // Click on Fixed questions from modal
    cy.log('Selecting Fixed questions option');
    cy.contains('Fixed questions', { timeout: 10000 }).click();
    cy.url().should('include', '/add-job');
});

Cypress.Commands.add('fillBasicFixedJobDetails', (jobData) => {
    cy.log('Filling basic job details');
    
    // Fill job title
    cy.log(`Filling job title: ${jobData.title}`);
    cy.get(selectors.jobs.jobTitleInput).clear().type(jobData.title);
    
    // Fill job description
    cy.log(`Filling job description: ${jobData.description}`);
    cy.get(selectors.jobs.jobDescriptionEditor).clear().type(jobData.description);
    
    // Select job location
    if (jobData.location) {
        cy.log(`Selecting job location: ${jobData.location}`);
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
                throw new Error(`Unknown job location: ${jobData.location}`);
        }
    }
    
    // Select job type
    if (jobData.jobType) {
        cy.log(`Selecting job type: ${jobData.jobType}`);
        cy.get(selectors.jobs.jobTypeSelect).click();
        switch(jobData.jobType) {
            case 'Full Time':
                cy.get(selectors.jobs.selectOption).contains(jobData.jobType).click();
                break;
            case 'Part Time':
                cy.get(selectors.jobs.selectOption).contains(jobData.jobType).click();
                break;
            default:
                console.log(`jobType value: "${jobData.jobType}", length: ${jobData.jobType.length}`);
                throw new Error(`Unknown job type: ${jobData.jobType}`);
        }
    }
    
    // Select interview duration
    if (jobData.duration) {
        cy.log(`Selecting interview duration: ${jobData.duration}`);
        cy.get(selectors.jobs.interviewDurationSelect).click();
        switch(jobData.duration.toLowerCase()) {
            case '20 - 30 minutes':
                cy.get(selectors.jobs.selectOption).contains(jobData.duration).click();
                break;
            case '40 - 50 minutes':
                cy.get(selectors.jobs.selectOption).contains(jobData.duration).click();
                break; 
            case '60 - 70 minutes':
                cy.get(selectors.jobs.selectOption).contains(jobData.duration).click();
                break;  
            default:
                throw new Error(`Unknown duration: ${jobData.duration}`);
        }
    }
    
    // Select interview language
    if (jobData.language) {
        cy.log(`Selecting interview language: ${jobData.language}`);
        cy.get(selectors.jobs.interviewLanguageSelect).click();
        switch (jobData.language) {
            case '/^British-English$/':
            cy.get('[role="option"]').contains(/^British-English$/).click();
            break;
            case '/^Cantonese$/':
            cy.get('[role="option"]').contains(/^Cantonese$/).click();
            break;
            case '/^Dutch$/':
            cy.get('[role="option"]').contains(/^Dutch$/).click();
            break;
            case '/^English$/':
            cy.get('[role="option"]').contains(/^English$/).click();
            break;
            case '/^French$/':
            cy.get('[role="option"]').contains(/^French$/).click();
            break;
            case '/^German$/':
            cy.get('[role="option"]').contains(/^German$/).click();
            break;
            case '/^Indonesian$/':
            cy.get('[role="option"]').contains(/^Indonesian$/).click();
            break;
            case '/^Japanese$/':
            cy.get('[role="option"]').contains(/^Japanese$/).click();
            break;
            case '/^Korean$/':
            cy.get('[role="option"]').contains(/^Korean$/).click();
            break;
            case '/^Malay$/':
            cy.get('[role="option"]').contains(/^Malay$/).click();
            break;
            case '/^Mandarin$/':
            cy.get('[role="option"]').contains(/^Mandarin$/).click();
            break;
            case '/^Portuguese$/':
            cy.get('[role="option"]').contains(/^Portuguese$/).click();
            break;
            case '/^Russian$/':
            cy.get('[role="option"]').contains(/^Russian$/).click();
            break;
            case '/^Spanish$/':
            cy.get('[role="option"]').contains(/^Spanish$/).click();
            break;
            case '/^Ukrainian$/':
            cy.get('[role="option"]').contains(/^Ukrainian$/).click();
            break;
            default:
            throw new Error(`Unknown language: ${jobData.language}`);
        }
    }
    
    // Handle resume options if specified
    if (jobData.askForResume) {
        cy.get(selectors.jobs.askForResumeCheckbox).click();
        if (jobData.resumeRequired) {
            cy.get(selectors.jobs.resumeRequired).click();
        } else {
            cy.get(selectors.jobs.resumeOptional).click();
        }
    }

    if (jobData.liveCodingCheckbox) {
        cy.get(selectors.jobs.liveCodingCheckbox).click();
    }
});

Cypress.Commands.add('submitJobCreationStep', () => {
    cy.log('Submitting job creation step');
    cy.intercept('GET', `${backendUrl()}/get-company-job/*`).as('getCompanyJob');
    cy.get(selectors.jobs.proceedButton).click();
});

Cypress.Commands.add('deleteAllDefaultQuestions', () => {
    cy.log('Deleting all default questions');
    const deleteNext = () => {
        cy.get('body').then(($body) => {
            const remaining = $body.find(selectors.jobs.deleteQuestionButton).length;
            if (remaining > 0) {
                cy.log(`${remaining} question(s) remaining, deleting one`);
                cy.get(selectors.jobs.deleteQuestionButton, { timeout: 3000 }).first().click();
                cy.get(selectors.jobs.confirmDeleteButton, { timeout: 3000 }).click();
                deleteNext(); // re-check the DOM after this deletion completes
            } else {
                cy.log('All default questions deleted');
            }
        });
    };
    // First, make sure the questions have actually loaded before starting
    cy.get(selectors.jobs.deleteQuestionButton, { timeout: 15000 }).should('have.length.greaterThan', 0);
    deleteNext();
});

Cypress.Commands.add('addCustomQuestion', (questions) => {
    // questions.forEach((questionText) => {
        cy.log(`Adding question: ${questions}`);
        cy.get(selectors.jobs.addInterviewQuestionButton).click();
        cy.get(selectors.jobs.questionEditor).last().clear().type(questions);
    // });
});

Cypress.Commands.add('navigateToCustomizeQuestions', () => {
    cy.log('Navigating to customize questions tab');
    cy.wait('@getCompanyJob', { timeout: 120000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });
    cy.wait(3000); // Wait for questions to load
});

Cypress.Commands.add('navigateToCodingQuestion', () => {
    cy.log('Navigating to coding question tab');
    cy.get(selectors.jobs.proceedButton).click();
    cy.wait('@getCompanyJob', { timeout: 60000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });
    cy.get(selectors.jobs.codingQuestionEditor, { timeout: 20000 }).should('have.length', 2);
});

Cypress.Commands.add('navigateToInterviewConfiguration', (interviewTranscription, interviewEngine) => {
    cy.log('Navigating to interview configuration tab');
    cy.get(selectors.jobs.proceedButton).click();
    cy.checkTranscriptionToggle(interviewTranscription, { timeout: 10000 });
    cy.selectInterviewEngine(interviewEngine, { timeout: 10000 });
});

Cypress.Commands.add('checkTranscriptionToggle', (interviewTranscription) => {
    cy.log('Checking transcription toggle');
    cy.get(selectors.jobs.transcriptionToggle).then(($toggle) => {
        const isChecked = $toggle.attr('aria-checked') === 'true';
        if (interviewTranscription && !isChecked) {
            cy.log('Transcription toggle is OFF, turning it ON');
            cy.get(selectors.jobs.transcriptionToggle).click();
        } else if (!interviewTranscription && isChecked) {
            cy.log('Transcription toggle is ON, turning it OFF');
            cy.get(selectors.jobs.transcriptionToggle).click();
        } else {
            cy.log(`Transcription toggle is already ${interviewTranscription ? 'ON' : 'OFF'}`);
        }
    });
    cy.get(selectors.jobs.transcriptionToggle).should('have.attr', 'aria-checked', String(interviewTranscription));
});

Cypress.Commands.add('selectInterviewEngine', (engine) => {
    cy.log(`Selecting interview engine: ${engine}`);
    if (engine === 'Basic') {
        cy.get(selectors.jobs.basicEngine).click();
    } else if (engine === 'Pro') {
        cy.get(selectors.jobs.proEngine).click();
    } else {
        throw new Error(`Unknown interview engine: ${engine}`);
    }
});

Cypress.Commands.add('navigateToSummary', () => {
    cy.log('Navigating to summary tab');
    // cy.wait(2000); // Wait for any potential loading
    cy.get(selectors.jobs.proceedButton).click();
    // cy.wait(2000); // Wait for summary to load
});

Cypress.Commands.add('publishJob', () => {
    cy.log('Publishing job');
    cy.intercept('POST', `${backendUrl()}/job/*/publish`).as('publishJob');
    cy.get(selectors.jobs.publishButton, { timeout: 10000 }).click();
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
