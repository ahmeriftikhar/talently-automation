const baseUrl = Cypress.config('baseUrl');

describe('Mock Interview Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        cy.logEnvironmentInfo();
        // Handle cookie consent if present
        cy.handleCookieConsent();
        cy.task('logMessage', {
            message: 'Starting mock interview test',
            style: 'green',
        });
    });

    it('should verify mock interview landing page elements', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify mock interview landing page elements',
            style: 'blue',
        });

        // Visit mock interview page
        cy.visit(`${baseUrl}mock-interview/interview?stage=job_information`);

        // Verify page elements
        cy.checkTextCommand('Practice giving live, conversational interviews for free.');
        cy.checkTextCommand('You can select a practice interview from popular roles, or just create an interview for any job title you wish to practice for.');

        // Verify buttons
        cy.verifyStartPracticingForFreeBtn();
        cy.verifyBookADemoBtn();

        cy.task('logMessage', {
            message: 'Mock interview landing page verified successfully',
            style: 'green',
        });
    });

    it('should complete default mock interview process', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should complete default mock interview process',
            style: 'blue',
        });

        // Visit mock interview page
        cy.visit(`${baseUrl}mock-interview/interview?stage=job_information`);

        // Select a default role and complete the process
        const companyID = Cypress.env('environment') === 'prod' ? 'LpxLNjHw9JYKfmPB4tIYwO7oopg1' : '84IilursBlRYW4dTsomTwpFKHv22';

        cy.task('logMessage', {
            message: `Using company ID: ${companyID}`,
            style: 'gray',
        });

        // Select first role
        cy.get('div.bg-transparent').first().click();

        // Complete default mock interview process
        cy.completeDefaultMockInterviewProcess(companyID);

        cy.task('logMessage', {
            message: 'Default mock interview completed successfully',
            style: 'green',
        });
    });

    it('should create custom mock interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should create custom mock interview',
            style: 'blue',
        });

        // Visit mock interview page
        cy.visit(`${baseUrl}mock-interview/interview?stage=job_information`);

        // Click on create custom interview
        cy.clickOnCreateCustomMockInterviewBtn();

        // Verify custom interview fields
        cy.verifyCustomMockInterviewFields();

        // Create custom interview with details
        const jobTitle = 'Custom Test Role';
        const jobDescription = 'This is a custom test interview for automation purposes';
        const interviewTime = '10';

        cy.createCustomMockInterview(jobTitle, jobDescription, interviewTime);

        // Submit custom interview
        cy.clickOnMockInterviewSubmitBtn();

        // Enter user details
        cy.enterUserDetailsForMockInterview('Test User', 'testuser@mailinator.com');

        // Start the interview
        cy.clickOnStartMockInterviewBtn();

        cy.task('logMessage', {
            message: 'Custom mock interview created successfully',
            style: 'green',
        });
    });

    it('should validate mock interview user information fields', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should validate mock interview user information fields',
            style: 'blue',
        });

        // Visit mock interview page
        cy.visit(`${baseUrl}mock-interview/interview?stage=job_information`);

        // Select a role
        cy.get('div.bg-transparent').first().click();

        // Try to proceed without filling user details
        cy.checkValidationOnUserInfoPage();

        cy.task('logMessage', {
            message: 'Mock interview field validation working correctly',
            style: 'green',
        });
    });

    it('should verify role switching functionality', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify role switching functionality',
            style: 'blue',
        });

        // Visit mock interview page
        cy.visit(`${baseUrl}mock-interview/interview?stage=job_information`);

        // Click through all roles
        cy.clickOnAllRoles();

        cy.task('logMessage', {
            message: 'Role switching functionality verified successfully',
            style: 'green',
        });
    });
});
