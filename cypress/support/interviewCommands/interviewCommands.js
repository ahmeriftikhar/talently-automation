const baseUrl = Cypress.config('baseSecUrl');
const secUrl = Cypress.config('baseUrl');

// Locators
const userAccNameInput = '[placeholder="Name"]';
const userAccEmailInput = '[placeholder="Email"]';
const userAccCountryDropDown = 'button[role="combobox"]';
const userAccPhoneInput = '[placeholder="Phone number"]';
const termsCheckbox = '[type="checkbox"]';
const proceedInterviewBtn = '#proceed-interview-click-candidate';
const joinInterviewBtn = '#join-now-interview';
const startInterviewBtn = '#start-interview-click-candidate';
const modalSelector = '.modal-dialog';
const joinInterviewCheckbox = '#devices_checked';

// Intercept calls
const textToSpeechCall = `${secUrl}/api/text-to-speech`;
const userLoginCall = `${baseUrl}/login`;
const startInterviewCall = `${baseUrl}/interview/start`;
const interviewCompletedCall = `${baseUrl}/integration-config/byJob/*?event=INTERVIEW_COMPLETED`;
const getJobCandidateCall = `${baseUrl}/get-job-candidate/*`;

// Custom Commands
Cypress.Commands.add('inputUserAccName', (userAccName) => {
    cy.get(userAccNameInput).type(userAccName);
});

Cypress.Commands.add('inputUserAccEmail', (userAccEmail) => {
    cy.get(userAccEmailInput).type(userAccEmail);
});

Cypress.Commands.add('inputUserAccPhone', (userAccPhone = '12345') => {
    cy.get(userAccPhoneInput).type(userAccPhone);
});

Cypress.Commands.add('clickCheckboxOnUserSignUp', () => {
    cy.get(termsCheckbox).click();
});

Cypress.Commands.add('clickOnProceedInterviewBtn', () => {
    cy.get(proceedInterviewBtn).click();
});

Cypress.Commands.add('clickOnJoinTheInterviewBtn', () => {
    cy.get(joinInterviewCheckbox).click();
    cy.get(joinInterviewBtn, { timeout: 60000 }).click();
});

Cypress.Commands.add('clickOnStartInterviewBtn', () => {
    cy.get(startInterviewBtn).click();
});

Cypress.Commands.add('selectCountry', (country) => {
    cy.get(userAccCountryDropDown).type(
        country === 'Afghanistan' ? '{downarrow}{uparrow}{enter}' : '{downarrow}{enter}'
    );
});

Cypress.Commands.add('checkInactivityModalAndClickOnResumeBtn', () => {
    cy.get('body').then($body => {
        if ($body.find(modalSelector).length > 0) {
            cy.contains('Resume Interview').click();
        } else {
            cy.log('Modal did not appear');
        }
    });
});

Cypress.Commands.add('registerUserAccForInterview', (userAccName, userAccEmail, country, userAccPhone) => {
    cy.intercept('POST', userLoginCall).as('userLoginCall');
    cy.inputUserAccName(userAccName);
    cy.inputUserAccEmail(userAccEmail);
    cy.selectCountry(country);
    cy.inputUserAccPhone(userAccPhone);
    cy.clickCheckboxOnUserSignUp();
    cy.clickOnProceedInterviewBtn();
    cy.wait('@userLoginCall').then((userLoginInterception) => {
        const userId = userLoginInterception.response.body.localId;
        cy.wrap({ userId }).as('userData');
    });
});

Cypress.Commands.add('joinAndStartInterview', () => {
    cy.intercept('POST', startInterviewCall).as('startInterviewCall');
    cy.intercept('POST', textToSpeechCall).as('textToSpeechCall');
    cy.clickOnJoinTheInterviewBtn();
    cy.wait('@startInterviewCall').then((startInterception) => {
        const callId = startInterception.request.body.callId;
        cy.wrap({ callId }).as('callData');
    });
    cy.wait(20000);
    cy.clickOnStartInterviewBtn();
});

Cypress.Commands.add('textToSpeech', (message) => {
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech);
});

Cypress.Commands.add('getQuestionFromBot', (i) => {
    cy.wait(10000);
    i = i + 1;
    let j = 2 * i - 1;
    if (i == 1) {
        cy.checkInactivityModalAndClickOnResumeBtn();
        cy.wait(10000);
        cy.get(`:nth-child(${j}) > .overflow-hidden > .text-xs`).invoke('text').then((question) => {
            return question;
        });
    }
    if (i > 1) {
        cy.checkInactivityModalAndClickOnResumeBtn();
        cy.wait(20000);
        cy.checkInactivityModalAndClickOnResumeBtn();
        cy.get(`:nth-child(${j}) > .overflow-hidden > .text-xs`).invoke('text').then((question) => {
            return question;
        });
    }
});
