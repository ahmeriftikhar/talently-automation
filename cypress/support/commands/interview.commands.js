import { selectors } from '../selectors/selectors';
import { faker } from '@faker-js/faker';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');
const frontendBaseUrl = () => Cypress.env('frontendBaseUrl') || Cypress.config('baseUrl');

// API endpoints
const textToSpeechCall = `${frontendBaseUrl()}/api/text-to-speech`;
const startInterviewCall = `${backendUrl()}/interview/start`;
const interviewCompletedCall = `${backendUrl()}/integration-config/byJob/*?event=INTERVIEW_COMPLETED`;
const getJobCandidateCall = `${backendUrl()}/get-job-candidate/*`;
const generateAnswerEndpoint = (jobId) => `${backendUrl()}/job/${jobId}/generate-answer`;
const interviewCallEndpoint = `${backendUrl()}/interview-call`;

// Custom commands for candidate registration
Cypress.Commands.add('inputCandidateName', (name) => {
    cy.get(selectors.candidate.nameInput).clear().type(name);
});

Cypress.Commands.add('inputCandidateEmail', (email) => {
    cy.get(selectors.candidate.emailInput).clear().type(email);
});

Cypress.Commands.add('inputCandidatePhone', (phone = '1234567890') => {
    cy.get(selectors.candidate.phoneInput).clear().type(phone);
});

Cypress.Commands.add('selectCountry', (country) => {
    cy.get(selectors.candidate.countrySelect).type(country === 'Afghanistan' ? '{downarrow}{uparrow}{enter}' : '{downarrow}{enter}');
});

Cypress.Commands.add('acceptTerms', () => {
    cy.get(selectors.candidate.termsCheckbox).click();
});

Cypress.Commands.add('clickProceedButton', () => {
    cy.get(selectors.candidate.proceedButton).click();
});

Cypress.Commands.add('clickJoinNowButton', () => {
    cy.get(selectors.candidate.devicesChecked).click();
    cy.get(selectors.candidate.joinNowButton, { timeout: 60000 }).click();
});

Cypress.Commands.add('clickStartInterviewButton', () => {
    cy.get(selectors.candidate.startInterviewButton, { timeout: 30000 }).should('be.visible').click();
});

// Register candidate for interview
Cypress.Commands.add('registerCandidateForInterview', (name, email, country, phone, jobId) => {
    const loginEndpoint = `${backendUrl()}/login/${jobId}`;
    cy.intercept('POST', loginEndpoint).as('userLoginCall');
    cy.inputCandidateName(name);
    cy.inputCandidateEmail(email);
    cy.selectCountry(country);
    cy.inputCandidatePhone(phone);
    cy.acceptTerms();
    cy.clickProceedButton();
    cy.wait('@userLoginCall', { timeout: 30000 }).then((interception) => {
        const userId = interception.response.body.localId;
        cy.wrap({ userId }).as('userData');
        cy.task('logMessage', {
            message: `Candidate registered with userId: ${userId}`,
            style: 'green',
        });
    });
});

// Handle the resume-upload step (shown only when the job asks for a resume).
// `candidateResume` is the job's `candidate_resume` field from get-job-candidate:
//   - null/undefined  -> the job does NOT ask for a resume, so no upload step appears; continue normally.
//   - { required: true }  -> resume is mandatory; Proceed stays disabled until a PDF is uploaded.
//   - { required: false } -> resume is optional; still upload then continue (per requirement).
Cypress.Commands.add('uploadCandidateResumeIfRequired', (candidateResume) => {
    if (!candidateResume) {
        cy.task('logMessage', {
            message: 'Job does not ask for a resume — continuing with the normal flow',
            style: 'gray',
        });
        return;
    }

    const isRequired = !!candidateResume.required;
    cy.task('logMessage', {
        message: `Job asks for a resume (${isRequired ? 'required' : 'optional'}) — uploading a PDF`,
        style: 'blue',
    });

    // The resume upload form appears after the registration Proceed. Wait for its (hidden) file input.
    cy.get(selectors.candidate.resumeFileInput, { timeout: 30000 }).should('exist');

    // Upload the sample resume PDF from fixtures (input accepts application/pdf only, max 2MB).
    cy.get(selectors.candidate.resumeFileInput).selectFile(
        'cypress/fixtures/resume.pdf',
        { force: true } // input is visually hidden (opacity-0 / h-0)
    );

    // Wait for the upload to finish (the "Upload Latest" control only renders after a successful upload),
    // then Proceed past the resume step.
    cy.get(selectors.candidate.resumeUploadedIndicator, { timeout: 60000 }).should('be.visible');
    cy.get(selectors.candidate.resumeProceedButton, { timeout: 60000 }).should('not.be.disabled').click();

    cy.task('logMessage', {
        message: 'Resume uploaded and resume step completed',
        style: 'green',
    });
});

// Join and start interview
Cypress.Commands.add('joinAndStartInterview', () => {
    cy.intercept('POST', startInterviewCall).as('startInterviewCall');
    cy.intercept('POST', textToSpeechCall).as('textToSpeechCall');

    cy.clickJoinNowButton();

    cy.wait('@startInterviewCall').then((interception) => {
        const callId = interception.request.body.callId;
        cy.wrap({ callId }).as('callData');
        cy.task('logMessage', {
            message: `Interview started with callId: ${callId}`,
            style: 'green',
        });
    });

    // Wait for screen sharing modal and counter using element-based wait
    cy.clickStartInterviewButton();
});

// Handle inactivity modal
Cypress.Commands.add('handleInactivityModal', () => {
    cy.get('body', { timeout: 15000 }).then(($body) => {
        if ($body.find(selectors.interview.inactivityModal).length > 0) {
            cy.log('Inactivity modal detected, clicking Resume button');
            cy.get(selectors.interview.resumeButton, { timeout: 10000 }).should('be.visible').click();
        } else {
            cy.log('No inactivity modal detected');
        }
    });
});

// Handle termination box
Cypress.Commands.add('handleTerminationBox', () => {
    cy.get('body', { timeout: 15000 }).then(($body) => {
        if ($body.find(selectors.interview.terminationBox).length > 0) {
            cy.log('Termination box detected, clicking Continue button');
            cy.get(selectors.interview.continueButton, { timeout: 30000 }).should('be.visible').click();
        } else {
            cy.log('No termination box detected');
        }
    });
});

// Get the current question from the transcript.
// The transcript interleaves bot questions AND user answers, so positional indexing drifts as the
// chat grows. Instead: wait for the bot to START then FINISH speaking, then read the LAST (newest)
// transcript message — which is the question the bot just finished asking. This is robust regardless
// of how many prior messages exist and avoids empty/garbled reads.
Cypress.Commands.add('getQuestionFromBot', (questionIndex) => {
    cy.handleInactivityModal();
    cy.handleTerminationBox();
    cy.get(selectors.interview.conversationBox, { timeout: 15000 }).should('exist');

    // Bot panel (the one with the "Talently" label) carries the ring class `border-4 border-[#00BBF9]`
    // while the bot is speaking.
    const isBotSpeaking = ($b) =>
        $b.find('p:contains("Talently")').closest('.border-4.border-\\[\\#00BBF9\\]').length > 0;

    // Wait for the bot to start speaking first (so we don't read/answer before it has begun — the race),
    // then wait for it to finish. Both are soft-bounded so they never hang.
    const waitForBotToStart = (elapsed) =>
        cy.get('body', { log: false }).then(($b) => {
            if (isBotSpeaking($b) || elapsed >= 30000) return;
            return cy.wait(1000, { log: false }).then(() => waitForBotToStart(elapsed + 1000));
        });

    const waitForBotToFinish = (elapsed) =>
        cy.get('body', { log: false }).then(($b) => {
            if (!isBotSpeaking($b) || elapsed >= 180000) return;
            return cy.wait(1000, { log: false }).then(() => waitForBotToFinish(elapsed + 1000));
        });

    cy.task('logMessage', {
        message: 'Waiting for bot to start, then finish speaking...',
        style: 'yellow',
    });

    // Read the LATEST BOT message. In the transcript, bot bubbles use bg-[#5B5048] while candidate
    // bubbles use bg-[#3DCFFF]; plain `.last()` on the shared text selector can land on the candidate's
    // answer or an empty node, which sends an empty question ("please send the question"). So prefer the
    // last bot bubble, falling back to the last transcript message only if the bot class isn't found.
    const botBubbleSelector = '[class*="5B5048"]';

    return waitForBotToStart(0)
        .then(() => waitForBotToFinish(0))
        .then(() => cy.get('body'))
        .then(($body) => {
            const target = $body.find(botBubbleSelector).length > 0
                ? botBubbleSelector
                : selectors.interview.conversationBox;
            return cy.get(target)
                .last()
                .invoke('text')
                .then((question) => {
                    const trimmedQuestion = question.trim();
                    const isCompletionMessage = /interview\s+is\s+completed/i.test(trimmedQuestion);
                    if (isCompletionMessage) {
                        return cy.task('logMessage', {
                            message: 'Completion message detected instead of a question',
                            style: 'green',
                        }).then(() => null);
                    }
                    return cy.task('logMessage', {
                        message: `Question ${questionIndex + 1}: ${trimmedQuestion}`,
                        style: 'gray',
                    }).then(() => trimmedQuestion);
                });
        });
});

// Generate answer using API
Cypress.Commands.add('generateAnswer', (callId, userId, question, jobId, sid) => {
    cy.handleInactivityModal();
    cy.handleTerminationBox();
    const formattedMessage = question.replace(/\s+/g, ' ').trim();

    cy.task('logMessage', {
        message: `Generating answer for: ${formattedMessage.substring(0, 50)}...`,
        style: 'blue',
    });

    return cy.request({
        method: 'POST',
        url: generateAnswerEndpoint(jobId),
        body: {
            sid: sid,
            callId: callId,
            question: formattedMessage,
            userId: userId
        },
        timeout: 90000,
    }).then((response) => {
        if (response.status === 200) {
            const answer = response.body.answer || "I want to skip this question";
            cy.task('logMessage', {
                message: `Generated answer: ${answer}`,
                style: 'green',
            }).then(() => answer);
        } else {
            const answer = response.body.answer || "I want to skip this question";
            cy.task('logMessage', {
                message: 'Failed to generate answer, using fallback',
                style: 'red',
            }).then(() => answer);
        }
    });
});

// Send answer using API
Cypress.Commands.add('sendAnswer', (sid, answer, callId, userId, userName, interviewDuration, interviewType = 'fixed') => {
    cy.handleInactivityModal();
    cy.handleTerminationBox();
    const user_message_start_timestamp = new Date().toUTCString();

    const requestBody = {
        sid: sid,
        userMessage: answer,
        callId: callId,
        userId: userId,
        userName: userName,
        // Use the job's real type ('fixed' or 'dynamic') so dynamic-questions jobs are submitted
        // correctly; defaults to 'fixed' for backwards compatibility when not passed.
        interviewType: interviewType,
        interviewDuration: parseInt(interviewDuration.split('-')[1], 10), // "20 - 30 minutes" → 30
        companyId: 'dynamic',
        user_message_start_timestamp: user_message_start_timestamp
    };

    cy.task('logMessage', {
        message: `Sending answer: ${answer.substring(0, 50)}...`,
        style: 'blue',
    });

    return cy.request({
        method: 'POST',
        url: interviewCallEndpoint,
        body: requestBody,
        timeout: 90000,
    }).then((response) => {
        if (response.status === 200) {
            cy.task('logMessage', {
                message: 'Answer sent successfully',
                style: 'green',
            });
            return response.body;
        } else {
            cy.task('logMessage', {
                message: 'Failed to send answer',
                style: 'red',
            });
            return null;
        }
    });
});

// Check if interview is completed
Cypress.Commands.add('isInterviewCompleted', () => {
    return cy.url().then((url) => {
        const isOnFeedbackPage = url.includes('feedback');
        if (isOnFeedbackPage) {
            return true;
        }

        return cy.get('body').then(($body) => {
            const html = $body.html();
            const hasCompletionMessage = html.includes(selectors.interview.completedMessage);
            return hasCompletionMessage;
        });
    });
});

// Wait for interview completion
Cypress.Commands.add('waitForInterviewCompletion', (timeout = 2400000) => {
    cy.intercept('GET', interviewCompletedCall).as('interviewCompletedCall');

    cy.log('Waiting for interview to complete...');
    cy.task('logMessage', {
        message: 'Waiting for interview completion (max 40 minutes)',
        style: 'gray',
    });

    cy.wait('@interviewCompletedCall', { timeout: timeout }).its('response.statusCode').should('eq', 200);

    cy.task('logMessage', {
        message: 'Interview completed successfully',
        style: 'green',
    });
});

// Main interview flow without job creation
Cypress.Commands.add('interviewWithoutJobCreation', (interviewLink) => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentTime = new Date().toISOString().slice(11, 19);
    const filename = `interviewReportWithoutJobCreation_${currentDate}_${currentTime}.json`;
    const filepath = `cypress/fixtures/interviewReports/${filename}`;

    // Generate random user data with shorter names
    const randomName = faker.person.firstName();
    const randomEmail = faker.internet.email({ firstName: randomName }).toLowerCase();

    cy.task('logMessage', {
        message: `Starting interview without job creation for link: ${interviewLink}`,
        style: 'blue',
    });

    // Visit interview link and intercept job candidate call
    cy.intercept('GET', getJobCandidateCall).as('getJobCandidateCall');
    cy.visit(interviewLink);
    cy.handleCookieConsent();


    cy.wait('@getJobCandidateCall').then((interception) => {
        const interviewData = interception.response.body;
        const interviewType = interviewData.interviewType;
        const interviewDuration = interviewData.interviewTime;
        const jobDescription = interviewData.description;
        const jobTitle = interviewData.title;
        const yearsOfExp = interviewData.yearsOfExperience;
        const companyId = interviewData.companyId;
        // Resume requirement configured on the job: null => not asked; { required } => asked.
        const candidateResume = interviewData.candidate_resume;

        cy.task('logMessage', {
            message: `Job Details - Title: ${jobTitle}, Duration: ${interviewDuration}, Resume: ${candidateResume ? (candidateResume.required ? 'required' : 'optional') : 'not asked'}`,
            style: 'gray',
        });

        // Extract job ID from URL
        cy.url().then((url) => {
            const jobId = url.match(/\/interview\/(.+)$/)[1];
            cy.wrap(jobId).as('jobId');

            // Register candidate
            cy.registerCandidateForInterview(randomName, randomEmail, 'United States', '1234567890', jobId);

            cy.get('@userData').then(({ userId }) => {
                // If the job asks for a resume (required/optional), upload one before continuing;
                // otherwise this is a no-op and the normal flow proceeds.
                cy.uploadCandidateResumeIfRequired(candidateResume);

                // Join and start interview
                cy.joinAndStartInterview();

                cy.get('@callData').then(({ callId }) => {
                    // Wait for initial message using element-based wait
                    cy.get(selectors.interview.conversationBox, { timeout: 30000 }).should('exist');

                    // Get session storage sid using window directly
                    cy.window().then((win) => {
                        const sid = win.sessionStorage.getItem('sid') || 'default-sid';

                        // Create initial JSON data
                        const jsonData = {
                            jobTitle: jobTitle,
                            jobDescription: jobDescription,
                            interviewType: interviewType,
                            interviewDuration: interviewDuration,
                            yearsOfExp: yearsOfExp,
                            interviewLink: interviewLink,
                            userName: randomName,
                            userEmail: randomEmail,
                            userId: userId,
                            jobId: jobId,
                            companyId: companyId,
                            callId: callId,
                            sid: sid,
                            questionsAndAnswers: []
                        };

                        cy.writeFile(filepath, jsonData);

                        // Dynamic question handling - use a Cypress-friendly approach
                        cy.task('logMessage', {
                            message: 'Starting dynamic question loop (interview will complete naturally)',
                            style: 'green',
                        });

                        // Use a while loop with Cypress retry logic
                        let questionIndex = 0;
                        const maxQuestions = 50; // Safety limit

                        const processQuestions = () => {
                            if (questionIndex >= maxQuestions) {
                                cy.task('logMessage', {
                                    message: 'Reached max questions limit, stopping',
                                    style: 'red',
                                });
                                return;
                            }

                            // Check if interview is completed
                            cy.isInterviewCompleted().then((completed) => {
                                if (completed) {
                                    cy.task('logMessage', {
                                        message: 'Interview completion detected',
                                        style: 'green',
                                    });

                                    // Capture final state before redirect
                                    cy.readFile(filepath).then((data) => {
                                        data.completedAt = new Date().toISOString();
                                        data.finalQuestionIndex = questionIndex;
                                        cy.writeFile(filepath, data);
                                    });

                                    // Wait for redirect to feedback page
                                    cy.url({ timeout: 30000 }).should('include', 'feedback').then(() => {
                                        cy.task('logMessage', {
                                            message: 'Successfully redirected to feedback page',
                                            style: 'green',
                                        });
                                    });
                                    return;
                                }

                                // Get next question (with built-in text stabilization)
                                cy.getQuestionFromBot(questionIndex).then((question) => {
                                    if (question === null) {
                                        cy.task('logMessage', { message: 'Completion message received — stopping question loop', style: 'green' });
                                        return; // skip generateAnswer/sendAnswer entirely
                                    }
                                    // Generate answer for all questions
                                    cy.generateAnswer(callId, userId, question, jobId, sid).then((answer) => {
                                        cy.sendAnswer(sid, answer, callId, userId, randomName, interviewDuration, interviewType).then(() => {
                                            // Update JSON
                                            cy.readFile(filepath).then((data) => {
                                                data.questionsAndAnswers.push({ question, answer });
                                                cy.writeFile(filepath, data);
                                            });
                                            questionIndex++;
                                            // Wait for bot to process answer and provide feedback
                                            cy.wait(5000);
                                            // Wait for next question using element-based wait
                                            cy.get(selectors.interview.conversationBox, { timeout: 10000 }).should('exist');
                                            processQuestions();
                                        });
                                    });
                                });
                            });
                        };

                        // Start the question loop
                        processQuestions();

                        // Wait for interview completion
                        cy.waitForInterviewCompletion();
                    });
                });
            });
        });
    });
});
