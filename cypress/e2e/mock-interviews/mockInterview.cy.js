/**
 * Mock Interview journeys.
 *
 * Every test starts from the HOME page and clicks the CTA that navigates into the mock interview
 * (Home hero "Try AI Interview" -> /mock-interview/interview), rather than deep-linking the setup URL.
 *
 * Positive: create a mock job (predefined + custom) and conduct the interview to completion.
 * Negative: validation on the user-info and custom-job forms.
 *
 * Intended for the PROD environment (run with ENVIRONMENT=prod). The mock company id differs per env.
 */
const mockCompanyId = () =>
    Cypress.env('environment') === 'prod'
        ? 'LpxLNjHw9JYKfmPB4tIYwO7oopg1'
        : '84IilursBlRYW4dTsomTwpFKHv22';

describe('Mock Interview Tests', () => {
    Cypress.on('uncaught:exception', () => false);

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.task('logMessage', { message: 'Starting mock interview test', style: 'green' });
    });

    // ----------------------------- Positive: setup page -----------------------------
    it('should open the mock interview from the home page and show the job-information setup', () => {
        cy.task('logMessage', {
            message: 'Test Case: Open mock interview from home and verify the setup page',
            style: 'blue',
        });

        // Home -> "Try AI Interview" -> /mock-interview/interview
        cy.openMockInterviewFromHome();

        // Verified heading on the job-information setup page
        cy.checkTextCommand('Practice giving live, conversational interviews for free.');

        // Both primary CTAs are present (buttons sit at the bottom of a scroll container)
        cy.get('#mock-submit-interview').scrollIntoView().should('be.visible'); // Proceed
        cy.get('#mock-start-customisation-step2').scrollIntoView().should('be.visible'); // Create my custom interview
    });

    // ----------------------------- Negative: user-info validation -----------------------------
    it('should show validation errors when the user info is submitted empty', () => {
        cy.task('logMessage', {
            message: 'Test Case: User info validation (empty submit)',
            style: 'blue',
        });

        cy.openMockInterviewFromHome();

        // Predefined role is auto-selected -> Proceed to the user-information stage
        cy.clickOnMockInterviewSubmitBtn();

        // Submitting empty shows two "* Required" errors
        cy.checkValidationOnUserInfoPage();
    });

    // ----------------------------- Negative: custom-job validation -----------------------------
    it('should show validation errors on an empty custom interview form', () => {
        cy.task('logMessage', {
            message: 'Test Case: Custom interview validation (empty submit)',
            style: 'blue',
        });

        cy.openMockInterviewFromHome();

        // Enter custom mode and submit empty -> "* Required" errors
        cy.verifyCustomMockInterviewFields();
    });

    it('should reject a custom interview title with special characters', () => {
        cy.task('logMessage', {
            message: 'Test Case: Custom interview invalid (special-character) title',
            style: 'blue',
        });

        cy.openMockInterviewFromHome();
        cy.verifyCustomMockInterviewInvalidTitle();
    });

    // ----------------------------- Positive: full conduct (default) -----------------------------
    it('should complete a default (predefined) mock interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Complete a default mock interview end to end',
            style: 'blue',
        });

        cy.openMockInterviewFromHome();
        cy.completeDefaultMockInterviewProcess(mockCompanyId());

        cy.task('logMessage', {
            message: 'Default mock interview completed successfully',
            style: 'green',
        });
    });

    // ----------------------------- Positive: full conduct (custom) -----------------------------
    it('should complete a custom mock interview', () => {
        cy.task('logMessage', {
            message: 'Test Case: Complete a custom mock interview end to end',
            style: 'blue',
        });

        cy.openMockInterviewFromLanding();
        cy.completeCustomMockInterviewProcess(mockCompanyId());

        cy.task('logMessage', {
            message: 'Custom mock interview completed successfully',
            style: 'green',
        });
    });
});
