const baseUrl = Cypress.config('baseSecUrl');
const secUrl = Cypress.config('baseUrl');

// Locators
const startPracticingFreeBtn = '#mock-start-practicing';
const bookADemoBtn = '#book-demo';
const mockInterviewJDInput = '.DraftEditor-editorContainer:eq(0)';
const mockInterviewDurationInput = 'button[disabled]';
const rolesradiobtns = 'div.bg-transparent';
const createMyCustomInterviewBtn = '#mock-start-customisation-step2';
const mockInterviewSubmitBtn = '#mock-submit-interview';
const mockInterviewStartBtn = '#mock-start-interview-step1';
const mockInterviewRequiredFieldErr = 'span.text-xs.text-red-500';
const mockInterviewUserNameInput = '[name="user_name"]';
const mockInterviewUserEmailInput = '[name="user_email"]';
const createCustomMockInterviewBtn = '#mock-start-customisation';
const jobTitleCustomMockInterviewInput = '[name="job_title"]';
const jobDescriptionCustomMockInterviewInput = `.notranslate`;
const StartInterviewMockBtn = '#mock-start-interview';
const interviewTimeDropDownMockInterview = ':nth-child(4) > .w-full';

// Intercept calls
const mockInterviewCreateCall = `${baseUrl}/mock-interview/jobs`;
const mockInterviewInforCall = `${baseUrl}/mock-interview/*/job/*`;
const mockInterviewCompletedCall = `${secUrl}/_next/data/*/mock-interview/interview/interview-complete/*?id=*`;
const customMockInterviewInforCall = `${baseUrl}/mock-interview/*`;

// Constants
const errorTextsCustomMockInterviewFields = ['Title cannot contain special character', '* Required', 'Minimum interview duration is 10 mins'];

// Custom Commands
Cypress.Commands.add('verifyStartPracticingForFreeBtn', () => {
    cy.get(startPracticingFreeBtn).should('be.visible');
});

Cypress.Commands.add('verifyBookADemoBtn', () => {
    cy.get(bookADemoBtn).should('be.visible');
});

Cypress.Commands.add('verifymockInterviewJDFieldUnEditable', () => {
    cy.get(mockInterviewJDInput).find('div').should('have.attr', 'contenteditable', 'false');
});

Cypress.Commands.add('verifymockInterviewDurationFieldUnEditable', () => {
    cy.get(mockInterviewDurationInput).should('exist');
});

Cypress.Commands.add('verifyCreateMyCustomInterviewBtn', () => {
    cy.get(createMyCustomInterviewBtn).should('exist');
});

Cypress.Commands.add('clickOnMockInterviewSubmitBtn', () => {
    cy.get(mockInterviewSubmitBtn).click();
});

Cypress.Commands.add('clickOnCreateCustomMockInterviewBtn', () => {
    cy.get(createCustomMockInterviewBtn).click();
});

Cypress.Commands.add('clickOnStartMockInterviewBtn', () => {
    cy.get(StartInterviewMockBtn).click();
});

Cypress.Commands.add('waitForMockInterviewUpload', () => {
    cy.intercept('GET', mockInterviewCompletedCall).as('mockInterviewCompletedCall');
    cy.checkInactivityModalAndClickOnResumeBtn();
    cy.wait('@mockInterviewCompletedCall', { timeout: 2400000 }).its('response.statusCode').should('eq', 200);
});

Cypress.Commands.add('checkValidationOnUserInfoPage', () => {
    cy.get(mockInterviewStartBtn).click();
    cy.get(mockInterviewRequiredFieldErr).should('be.visible').and('have.length', 2);
});

Cypress.Commands.add('clickOnStartPracticingForFreeBtn', () => {
    cy.intercept('GET', mockInterviewCreateCall).as('mockInterviewCreateCall');
    cy.get(startPracticingFreeBtn).click();
    cy.wait('@mockInterviewCreateCall');
});

Cypress.Commands.add('clickOnAllRoles', () => {
    cy.get(rolesradiobtns).each(($radioButton) => {
        cy.wrap($radioButton).click();
    }).then(() => {
        const randomIndex = Math.floor(Math.random() * 4);
        cy.get(rolesradiobtns).eq(randomIndex).click();
    });
});

Cypress.Commands.add('enterUserDetailsForMockInterview', (fName, email) => {
    cy.get(mockInterviewUserNameInput).type(fName);
    cy.get(mockInterviewUserEmailInput).type(email);
});

Cypress.Commands.add('verifyCustomMockInterviewFields', () => {
    cy.clickOnCreateCustomMockInterviewBtn();
    cy.wait(1000);
    cy.clickOnMockInterviewSubmitBtn();
    cy.wait(1000);
    cy.get(mockInterviewRequiredFieldErr).should('be.visible').and('have.length', 3);
    for (let i = 0; i < errorTextsCustomMockInterviewFields.length; i++) {
        cy.get(mockInterviewRequiredFieldErr).eq(i).contains(errorTextsCustomMockInterviewFields[i]);
    }
});

Cypress.Commands.add('selectInterviewTimeMockInterview', (time) => {
    cy.get(interviewTimeDropDownMockInterview).type(
        time === '10 minutes' || time === '10' || time === 10 ? '{downarrow}{uparrow}{enter}' :
            time === '20 minutes' || time === '20' || time === 20 ? '{downarrow}{enter}' :
                time === '30 minutes' || time === '30' || time === 30 ? '{downarrow}{downarrow}{enter}' :
                    '{downarrow}{downarrow}{downarrow}{downarrow}{enter}'
    );
});

Cypress.Commands.add('createCustomMockInterview', (jobTitle, jobDescription, interviewTime) => {
    cy.get(jobTitleCustomMockInterviewInput).type(jobTitle);
    cy.get(jobDescriptionCustomMockInterviewInput).type(jobDescription);
    cy.selectInterviewTimeMockInterview(interviewTime);
});

Cypress.Commands.add('completeDefaultMockInterviewProcess', (companyID) => {
    cy.clickOnStartPracticingForFreeBtn();
    cy.enterUserDetailsForMockInterview('Test User', 'testuser@mailinator.com');
    cy.clickOnStartMockInterviewBtn();
    cy.waitForMockInterviewUpload();
});

Cypress.Commands.add('completeCustomMockInterviewProcess', (companyID) => {
    cy.clickOnCreateCustomMockInterviewBtn();
    cy.createCustomMockInterview('Software Engineer', 'We need a software engineer for our team', '10');
    cy.clickOnMockInterviewSubmitBtn();
    cy.enterUserDetailsForMockInterview('Test User', 'testuser@mailinator.com');
    cy.clickOnStartMockInterviewBtn();
    cy.waitForMockInterviewUpload();
});
