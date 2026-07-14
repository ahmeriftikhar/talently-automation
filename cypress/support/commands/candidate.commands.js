import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

Cypress.Commands.add('fillCandidateDetails', ({ name, email, country, phone }) => {
    cy.get(selectors.candidate.nameInput).clear().type(name);
    cy.get(selectors.candidate.emailInput).clear().type(email);
    
    if (country) {
        cy.get(selectors.candidate.countrySelect).click();
        cy.contains(country).click();
    }
    
    if (phone) {
        cy.get(selectors.candidate.phoneInput).clear().type(phone);
    }
});

Cypress.Commands.add('acceptCandidateTerms', () => {
    cy.get(selectors.candidate.termsCheckbox).check();
});

Cypress.Commands.add('proceedToInterview', () => {
    cy.intercept('POST', `${backendUrl()}/login`).as('candidateLogin');
    cy.get(selectors.candidate.proceedButton).click();
    cy.wait('@candidateLogin').its('response.statusCode').should('be.oneOf', [200, 201]);
});

Cypress.Commands.add('joinInterview', () => {
    cy.get(selectors.candidate.devicesChecked).check();
    cy.intercept('POST', `${backendUrl()}/interview/start`).as('startInterview');
    cy.get(selectors.candidate.joinNowButton).click();
    cy.wait('@startInterview').its('response.statusCode').should('be.oneOf', [200, 201]);
});

Cypress.Commands.add('startCandidateInterview', () => {
    cy.get(selectors.candidate.startInterviewButton).click();
});
