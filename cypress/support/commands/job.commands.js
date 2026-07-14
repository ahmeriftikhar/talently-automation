import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

Cypress.Commands.add('openFixedJobCreation', () => {
    cy.get(selectors.jobs.addJobButton).click();
    cy.get('body').then(($body) => {
        if ($body.find(selectors.jobs.fixedQuestionsOption).length > 0) {
            cy.get(selectors.jobs.fixedQuestionsOption).click();
        } else {
            cy.contains('Fixed questions').click();
        }
    });
    cy.url().should('include', '/add-job');
});

Cypress.Commands.add('fillBasicFixedJobDetails', ({ title, description, jobType = 'Full-time' }) => {
    cy.get(selectors.jobs.jobTitleInput).clear().type(title);
    cy.get(selectors.jobs.jobDescriptionEditor).first().click().type(description);

    // Select Job Type dropdown
    cy.get('body').then(($body) => {
        if ($body.find(selectors.jobs.jobTypeSelect).length > 0) {
            cy.log('Selecting Job Type: ' + jobType);
            cy.get(selectors.jobs.jobTypeSelect).click();
            cy.contains(jobType).click();
        } else {
            cy.log('Job Type dropdown not found, skipping selection');
        }
    });
});

Cypress.Commands.add('submitCurrentFooterStep', (aliasName) => {
    if (aliasName) {
        cy.intercept('PATCH', `${backendUrl()}/job/*`).as(aliasName);
    }
    cy.get(selectors.jobs.submitFooterButton).should('be.visible').click();
    if (aliasName) {
        cy.wait(`@${aliasName}`).its('response.statusCode').should('be.oneOf', [200, 201]);
    }
});

Cypress.Commands.add('publishCurrentJob', () => {
    cy.intercept('POST', `${backendUrl()}/job/*/publish`).as('publishJob');
    cy.get(selectors.jobs.submitFooterButton).should('be.visible').click();
    cy.wait('@publishJob').then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        const jobId = interception.request.url.match(/\/job\/([^/]+)\/publish/)?.[1];
        expect(jobId, 'published job id').to.be.a('string').and.not.be.empty;
        cy.wrap(jobId).as('publishedJobId');
    });
});

Cypress.Commands.add('extractPublishedInterviewLink', () => {
    cy.get('@publishedJobId').then((jobId) => {
        const expectedPath = `/interview/${jobId}`;
        cy.contains(expectedPath, { timeout: 60000 }).should('be.visible');
        cy.location('origin').then((origin) => {
            cy.wrap(`${origin}${expectedPath}`).as('candidateInterviewLink');
        });
    });
});
