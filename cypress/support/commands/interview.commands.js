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
    cy.get(selectors.candidate.startInterviewButton).click();
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
    
    // Wait for screen sharing modal and counter
    cy.wait(20000);
    cy.clickStartInterviewButton();
});

// Handle inactivity modal
Cypress.Commands.add('handleInactivityModal', () => {
    cy.get('body').then(($body) => {
        if ($body.find(selectors.interview.inactivityModal).length > 0) {
            cy.log('Inactivity modal detected, clicking Resume button');
            cy.get(selectors.interview.resumeButton).click();
        } else {
            cy.log('No inactivity modal detected');
        }
    });
});

// Handle termination box
Cypress.Commands.add('handleTerminationBox', () => {
    cy.get('body').then(($body) => {
        if ($body.find(selectors.interview.terminationBox).length > 0) {
            cy.log('Termination box detected, clicking Continue button');
            cy.get(selectors.interview.continueButton, { timeout: 30000 }).click();
        } else {
            cy.log('No termination box detected');
        }
    });
});

// Get question from conversation box
Cypress.Commands.add('getQuestionFromBot', (questionIndex) => {
    cy.handleInactivityModal();
    cy.wait(10000);
    
    // Try multiple selector approaches for conversation box
    return cy.get('body').then(($body) => {
        // Try the nth-child approach first
        const childIndex = (questionIndex + 1) * 2 - 1;
        if ($body.find(`:nth-child(${childIndex}) > .overflow-hidden > .text-xs`).length > 0) {
            return cy.get(`:nth-child(${childIndex}) > .overflow-hidden > .text-xs`)
                .invoke('text')
                .then((question) => {
                    cy.task('logMessage', {
                        message: `Question ${questionIndex + 1}: ${question}`,
                        style: 'gray',
                    });
                    return question.trim();
                });
        } else {
            // Fallback to getting all conversation elements and picking the right one
            return cy.get('.overflow-hidden > .text-xs').eq(questionIndex)
                .invoke('text')
                .then((question) => {
                    cy.task('logMessage', {
                        message: `Question ${questionIndex + 1}: ${question}`,
                        style: 'gray',
                    });
                    return question.trim();
                });
        }
    });
});

// Generate answer using API
Cypress.Commands.add('generateAnswer', (callId, userId, question, jobId) => {
    const formattedMessage = question.replace(/\s+/g, ' ').trim();
    
    cy.task('logMessage', {
        message: `Generating answer for: ${formattedMessage.substring(0, 50)}...`,
        style: 'blue',
    });
    
    return cy.request({
            callId: callId,
            question: formattedMessage,
            userId: userId
        },
        {timeout: 90000},
    ).then((response) => {
        if (response.status === 200) {
            const answer = response.body.answer || "I want to skip this question";
            cy.task('logMessage', {
                message: `Generated answer: ${answer.substring(0, 50)}...`,
                style: 'green',
            });
            return answer;
        } else {
            cy.task('logMessage', {
                message: 'Failed to generate answer, using fallback',
                style: 'red',
            });
            return "I want to skip this question";
        }
    });
});

// Send answer using API
Cypress.Commands.add('sendAnswer', (sid, answer, callId, userId, userName) => {
    const user_message_start_timestamp = new Date().toUTCString();
    
    const requestBody = {
        sid: sid,
        userMessage: answer,
        callId: callId,
        userId: userId,
        userName: userName,
        interviewType: 'fixed',
        interviewDuration: 'dynamic',
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
    return cy.get('body').then(($body) => {
        const html = $body.html();
        return html.includes(selectors.interview.completedMessage);
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
        
        cy.task('logMessage', {
            message: `Job Details - Title: ${jobTitle}, Type: ${interviewType}, Duration: ${interviewDuration}`,
            style: 'gray',
        });
        
        // Extract job ID from URL
        cy.url().then((url) => {
            const jobId = url.match(/\/interview\/(.+)$/)[1];
            cy.wrap(jobId).as('jobId');
            
            // Register candidate
            cy.registerCandidateForInterview(randomName, randomEmail, 'United States', '1234567890', jobId);
            
            cy.get('@userData').then(({ userId }) => {
                // Join and start interview
                cy.joinAndStartInterview();
                
                cy.get('@callData').then(({ callId }) => {
                    // Wait for initial message and counter
                    cy.wait(20000);
                    
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
                                    return;
                                }
                                
                                // Get next question
                                cy.getQuestionFromBot(questionIndex).then((question) => {
                                    // Generate answer for all questions
                                    cy.generateAnswer(callId, userId, question, jobId).then((answer) => {
                                        cy.sendAnswer(sid, answer, callId, userId, randomName).then(() => {
                                            // Update JSON
                                            cy.readFile(filepath).then((data) => {
                                                data.questionsAndAnswers.push({ question, answer });
                                                cy.writeFile(filepath, data);
                                            });
                                            questionIndex++;
                                            cy.wait(5000);
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
