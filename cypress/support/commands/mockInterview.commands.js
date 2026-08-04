import { faker } from '@faker-js/faker';
import { selectors } from '../selectors/selectors';

const frontendBaseUrl = () => Cypress.env('frontendBaseUrl') || Cypress.config('baseUrl');
const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

// Mock selectors live in the central selectors file (selectors.mock.*).
const sel = selectors.mock;

// Mock API endpoints
const mockCreateFromJobCall = `${backendUrl()}/mock-interview/*/job/*`; // predefined role
const mockCreateCustomCall = `${backendUrl()}/mock-interview/*`; // custom job
const mockCompletedCall = `${frontendBaseUrl()}/_next/data/*/mock-interview/interview/interview-complete/*?id=*`;
const generateAnswerEndpoint = (jobId) => `${backendUrl()}/job/${jobId}/generate-answer`;
const interviewCallEndpoint = `${backendUrl()}/interview-call`;

// ---------------------------------------------------------------------------
// Navigation / entry
// ---------------------------------------------------------------------------

// Open the home page and click the CTA that navigates into the mock interview flow.
// (Home hero "Try AI Interview" -> /mock-interview/interview.)
Cypress.Commands.add('openMockInterviewFromHome', () => {
    cy.visit('/');
    cy.handleCookieConsent();
    // The id appears more than once on the home hero — click the first visible one.
    cy.get(sel.startPracticingBtn, { timeout: 20000 }).filter(':visible').first().click();
    cy.url({ timeout: 20000 }).should('include', '/mock-interview/interview');
    cy.handleCookieConsent();
});

// Open the mock-interview LANDING page and click "Start Practicing for Free!".
Cypress.Commands.add('openMockInterviewFromLanding', () => {
    cy.visit(`${frontendBaseUrl().replace(/\/$/, '')}/mock-interview`);
    cy.handleCookieConsent();
    cy.get(sel.startPracticingBtn, { timeout: 20000 }).filter(':visible').first().click();
    cy.url({ timeout: 20000 }).should('include', '/mock-interview/interview');
    cy.handleCookieConsent();
});

// ---------------------------------------------------------------------------
// Landing / job-information verifications
// ---------------------------------------------------------------------------

Cypress.Commands.add('verifyStartPracticingForFreeBtn', () => {
    cy.get(sel.startPracticingBtn).filter(':visible').first().should('be.visible');
});

// Book-a-Demo lives on the HOME hero only.
Cypress.Commands.add('verifyBookADemoBtn', () => {
    cy.get(sel.bookADemoBtn).filter(':visible').first().should('be.visible');
});

// Switch the predefined role via the "Select Job Type" Radix dropdown (roles are NOT div.bg-transparent).
Cypress.Commands.add('selectMockRole', (roleTitle) => {
    cy.contains('label, div, span', 'Select Job Type', { timeout: 10000 });
    cy.get(sel.selectTrigger).first().click();
    cy.get(sel.selectOption, { timeout: 10000 }).contains(roleTitle).click();
});

// ---------------------------------------------------------------------------
// Custom interview
// ---------------------------------------------------------------------------

Cypress.Commands.add('clickOnCreateCustomMockInterviewBtn', () => {
    cy.get(sel.createCustomBtn, { timeout: 10000 }).click();
});

Cypress.Commands.add('verifyCreateMyCustomInterviewBtn', () => {
    cy.get(sel.createCustomBtn).should('exist');
});

Cypress.Commands.add('clickOnMockInterviewSubmitBtn', () => {
    cy.get(sel.proceedBtn).click();
});

// Select the interview duration from the "Interview duration (mins)" Radix dropdown by option text.
Cypress.Commands.add('selectInterviewTimeMockInterview', (minutes) => {
    cy.contains('Interview duration')
        .parents()
        .find(sel.selectTrigger)
        .first()
        .click({ force: true });
    cy.get(sel.selectOption, { timeout: 10000 }).contains(String(minutes)).click();
});

Cypress.Commands.add('createCustomMockInterview', (jobTitle, jobDescription, interviewMinutes) => {
    cy.get(sel.jobTitleInput, { timeout: 10000 }).clear().type(jobTitle);
    cy.get(sel.jobDescriptionEditor).clear().type(jobDescription);
    cy.selectInterviewTimeMockInterview(interviewMinutes);
});

// Negative: submitting the empty custom form must NOT advance to the user-information stage.
// (Behaviour-based: robust to how the validation error is styled.)
Cypress.Commands.add('verifyCustomMockInterviewFields', () => {
    cy.clickOnCreateCustomMockInterviewBtn();
    cy.get(sel.jobTitleInput, { timeout: 10000 }).should('be.visible'); // in custom mode
    cy.get(sel.jobDescriptionEditor).should('be.visible');
    cy.get(sel.jobTitleInput).clear();
    cy.get(sel.jobDescriptionEditor).clear();
    cy.get(sel.proceedBtn).click();
    // Validation blocks progression — the user-info fields must NOT appear, and we stay in custom mode.
    cy.get(sel.userNameInput).should('not.exist');
    cy.get(sel.jobTitleInput).should('be.visible');
});

// Negative: a special-character title must NOT advance the form.
Cypress.Commands.add('verifyCustomMockInterviewInvalidTitle', () => {
    cy.clickOnCreateCustomMockInterviewBtn();
    cy.get(sel.jobTitleInput, { timeout: 10000 }).clear().type('@@@###');
    cy.get(sel.jobDescriptionEditor).clear().type('This is a sufficiently long job description for validation.');
    cy.get(sel.proceedBtn).click();
    // Invalid title keeps us on the job-information stage
    cy.get(sel.userNameInput).should('not.exist');
    cy.get(sel.jobTitleInput).should('be.visible');
});

// ---------------------------------------------------------------------------
// User information stage
// ---------------------------------------------------------------------------

Cypress.Commands.add('enterUserDetailsForMockInterview', (name, email) => {
    cy.get(sel.userNameInput, { timeout: 10000 }).clear().type(name);
    cy.get(sel.userEmailInput).clear().type(email);
});

// Negative: submitting the user-info form empty must NOT start the interview (stays on user info).
Cypress.Commands.add('checkValidationOnUserInfoPage', () => {
    cy.get(sel.userNameInput, { timeout: 20000 }).should('be.visible'); // on user-information stage
    cy.get(sel.startInterviewStep1Btn, { timeout: 20000 }).click({ force: true });
    // Empty submit is blocked — the user fields remain and the in-call start button does not appear.
    cy.get(sel.userNameInput).should('be.visible');
    cy.get(sel.inCallStartBtn).should('not.exist');
});

// ---------------------------------------------------------------------------
// Interview conduct (self-answering)
// ---------------------------------------------------------------------------

// Inactivity/termination modal handler (was missing in this project).
Cypress.Commands.add('checkInactivityModalAndClickOnResumeBtn', () => {
    cy.get('body').then(($body) => {
        if ($body.find(sel.resumeBtn).length > 0) {
            cy.log('Inactivity modal detected — clicking Resume Interview');
            cy.get(sel.resumeBtn, { timeout: 10000 }).click();
        } else {
            cy.log('No inactivity modal');
        }
    });
});

// Wait for the mock interview upload/completion (Next.js data fetch for the interview-complete page).
// Confirm the mock interview reached completion. The loop stops once the bot's "interview is
// completed" message appears, so completion is already OBSERVABLE here (via the interview-complete
// redirect OR the inline completion message). Waiting on the /_next/data completion GET instead was
// racy — that request fires during the loop, before this command's intercept exists, so cy.wait
// never saw it and hung for the full 40-minute timeout. Poll the observable state instead.
Cypress.Commands.add('waitForMockInterviewUpload', () => {
    cy.checkInactivityModalAndClickOnResumeBtn();

    const maxWait = 300000; // 5 min — completion/redirect is near-immediate once the loop stops
    // Case-insensitive match (same as getQuestionFromBot's detection) so the message already on
    // screen is recognized immediately rather than missed by a case-sensitive includes().
    const completionRegex = /interview\s+is\s+completed/i;
    const waitForCompletion = (elapsed) =>
        cy.url({ log: false }).then((url) =>
            cy.get('body', { log: false }).then(($body) => {
                if (url.includes('interview-complete') || completionRegex.test($body.text())) {
                    cy.task('logMessage', { message: 'Mock interview completion confirmed', style: 'green' });
                    return;
                }
                if (elapsed >= maxWait) {
                    throw new Error('Mock interview did not reach the completion state within 5 minutes');
                }
                return cy.wait(2000, { log: false }).then(() => waitForCompletion(elapsed + 2000));
            })
        );

    waitForCompletion(0);
});

// Send an answer to the MOCK interview (interviewType + real companyId differ from the fixed flow).
Cypress.Commands.add('sendMockAnswer', (sid, answer, callId, userId, userName, companyId) => {
    return cy.request({
        method: 'POST',
        url: interviewCallEndpoint,
        body: {
            callId,
            sid,
            userId,
            userMessage: answer,
            interviewType: 'Techincal', // matches the value the product uses for mock interviews
            interviewDuration: 10,
            companyId,
            userName,
            user_message_start_timestamp: new Date().toUTCString(),
        },
        timeout: 90000,
        failOnStatusCode: false,
    }).then((response) => response.body);
});

// Drive the mock interview to completion by reading each bot question and auto-answering.
// Requires the mock-create response already captured as @mockCreate.
Cypress.Commands.add('conductMockInterview', (companyId) => {
    cy.wait('@mockCreate', { timeout: 60000 }).then((interception) => {
        const callId = interception.response.body.interview_id;
        const jobId = interception.response.body.job_id;
        const userId = interception.response.body.user_id;

        cy.task('logMessage', {
            message: `Mock interview created — callId: ${callId}, jobId: ${jobId}`,
            style: 'green',
        });

        // Start the in-call interview
        cy.get(sel.inCallStartBtn, { timeout: 30000 }).should('be.visible').click();
        cy.get(sel.conversationBox, { timeout: 30000 }).should('exist');

        cy.window().then((win) => {
            const sid = win.sessionStorage.getItem('sid') || 'default-sid';
            const userName = faker.person.firstName();

            let questionIndex = 0;
            const maxQuestions = 20; // safety cap

            const onCompletePage = ($body, url) =>
                url.includes('interview-complete') ||
                $body.html().includes('Interview is completed');

            const loop = () => {
                if (questionIndex >= maxQuestions) {
                    cy.task('logMessage', { message: 'Reached max mock questions — stopping', style: 'red' });
                    return;
                }
                cy.url().then((url) =>
                    cy.get('body').then(($body) => {
                        if (onCompletePage($body, url)) {
                            // Print the bot's final message so it's visible the interview really
                            // completed (bot bubbles use bg-[#5B5048]; read the last one).
                            const botBubbles = $body.find('[class*="5B5048"]');
                            const finalMessage = botBubbles.length ? botBubbles.last().text().trim() : '';
                            cy.task('logMessage', {
                                message: finalMessage
                                    ? `Mock interview completed — final message: "${finalMessage}"`
                                    : 'Mock interview completed',
                                style: 'green',
                            });
                            return;
                        }
                        cy.checkInactivityModalAndClickOnResumeBtn();
                        // getQuestionFromBot waits for the bot to start->finish speaking, then reads the last bot bubble
                        cy.getQuestionFromBot(questionIndex).then((question) => {
                            if (!question) {
                                cy.task('logMessage', { message: 'Completion message — stopping mock loop', style: 'green' });
                                return;
                            }
                            cy.generateAnswer(callId, userId, question, jobId, sid).then((answer) => {
                                cy.sendMockAnswer(sid, answer, callId, userId, userName, companyId).then(() => {
                                    questionIndex++;
                                    cy.wait(5000);
                                    loop();
                                });
                            });
                        });
                    })
                );
            };

            loop();
            cy.waitForMockInterviewUpload();
        });
    });
});

// ---------------------------------------------------------------------------
// Full positive journeys
// ---------------------------------------------------------------------------

// Default (predefined role) mock interview — assumes we are on the job_information stage.
Cypress.Commands.add('completeDefaultMockInterviewProcess', (companyId) => {
    const name = faker.person.firstName();
    const email = faker.internet.email({ firstName: name }).toLowerCase();

    // A predefined role is auto-selected; go straight to Proceed.
    cy.clickOnMockInterviewSubmitBtn();

    // User information
    cy.enterUserDetailsForMockInterview(name, email);

    // Capture the mock-create call fired when starting the interview
    cy.intercept('POST', mockCreateFromJobCall).as('mockCreate');
    cy.get(sel.startInterviewStep1Btn, { timeout: 30000 }).should('not.be.disabled').click();

    cy.conductMockInterview(companyId);
});

// Custom mock interview — assumes we are on the job_information stage.
Cypress.Commands.add('completeCustomMockInterviewProcess', (companyId) => {
    const name = faker.person.firstName();
    const email = faker.internet.email({ firstName: name }).toLowerCase();

    cy.clickOnCreateCustomMockInterviewBtn();
    cy.generateJobDescription().then((generatedDescription) => {
        const jobTitles = ['SQA Automation Engineer', 'Software Tester', 'Quality Assurance Engineer'];
        // Optional overrides from the workflow (CYPRESS_JOB_TITLE / _DESCRIPTION / _INTERVIEW_MINUTES),
        // with built-in fallbacks when not provided.
        const jobTitle = Cypress.env('JOB_TITLE') || jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const jobDescription = Cypress.env('JOB_DESCRIPTION') || generatedDescription;
        const interviewMinutes = Cypress.env('INTERVIEW_MINUTES') || 10;
        cy.createCustomMockInterview(jobTitle, jobDescription, interviewMinutes);
        cy.clickOnMockInterviewSubmitBtn();

        // User information
        cy.enterUserDetailsForMockInterview(name, email);

        // Custom flow creates the mock job on start
        cy.intercept('POST', mockCreateCustomCall).as('mockCreate');
        cy.get(sel.startInterviewStep1Btn, { timeout: 30000 }).should('not.be.disabled').click();

        cy.conductMockInterview(companyId);
    });
});
