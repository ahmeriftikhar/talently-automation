import { selectors } from '../selectors/selectors';

const c = selectors.candidateActions;

// From /create-job, click the first job card's "View All" to open its applied-candidates page.
Cypress.Commands.add('openAppliedCandidatesForFirstJob', () => {
    cy.log('Opening applied candidates for the first job via View All');
    cy.visit('/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 30000 }).should('be.visible');
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', 0);

    cy.intercept('GET', '**/candidates?*').as('getCandidates');
    cy.get(c.viewAllButton, { timeout: 15000 }).first().scrollIntoView().click();

    cy.url({ timeout: 15000 }).should('include', '/applied-candidates');
    cy.wait('@getCandidates', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
});

// Click a stage chip (Applied / Shortlisted / Rejected). Clicking the ALREADY-ACTIVE chip does not
// refetch (react-query keeps the same key), so only wait for the /candidates GET when the stage
// actually changes — otherwise the wait would time out with "no request ever occurred".
// Active chip carries the class `bg-[#E3F2FD]` (interviews.helper styling).
Cypress.Commands.add('selectCandidateStage', (label) => {
    cy.log(`Selecting candidate stage: ${label}`);
    cy.intercept('GET', '**/candidates?*').as('getCandidatesByStage');
    cy.contains('button', label, { timeout: 15000 }).then(($btn) => {
        const alreadyActive = ($btn.attr('class') || '').includes('bg-[#E3F2FD]');
        cy.wrap($btn).click();
        if (alreadyActive) {
            cy.log(`Stage "${label}" already active — no refetch expected`);
            cy.get(selectors.candidateActions.table, { timeout: 15000 }).should('exist');
        } else {
            cy.wait('@getCandidatesByStage', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
        }
    });
});

// Yield the number of candidate rows currently rendered.
Cypress.Commands.add('candidateRowCount', () => {
    return cy.get('body').then(($b) => $b.find(c.rows).length);
});

// Move the first ACTIONABLE candidate (unlocked + scored, so its kebab is enabled) via the given
// action, providing the required reason. `action` = 'shortlist' | 'reject' | 'reconsider'.
// Yields the moved candidate's name so the caller can assert the move.
Cypress.Commands.add('moveFirstCandidate', (action, reason = 'Automated test action') => {
    const optionSelector = {
        shortlist: c.shortlistOption,
        reject: c.rejectOption,
        reconsider: c.reconsiderOption,
    }[action];
    if (!optionSelector) throw new Error(`Unknown candidate action: ${action}`);

    cy.log(`Moving first candidate via "${action}"`);

    // Capture the first row's candidate name (from the name <h6>) for later assertions.
    return cy.get(c.rows, { timeout: 20000 }).first().find('h6').first().invoke('text').then((rawName) => {
        const name = rawName.trim();

        cy.intercept('PATCH', '**/interview/*').as('patchInterview');

        // Open the row's kebab (trigger must be enabled — i.e. unlocked & scored candidate)
        cy.get(c.rows).first().find(c.actionTrigger).should('be.visible').click({ force: true });

        // Menu is portaled to body — click the action item, then fill the required reason
        cy.get(optionSelector, { timeout: 10000 }).should('be.visible').click();
        cy.get(c.reasonTextarea, { timeout: 10000 }).should('be.visible').clear().type(reason);
        cy.get(c.confirmActionButton).should('not.be.disabled').click();

        cy.wait('@patchInterview', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
        cy.contains('Interview status updated', { timeout: 15000 }).should('be.visible');

        return cy.wrap(name);
    });
});

// Move a specific candidate (found by name) via the given action — used to restore state after a test.
Cypress.Commands.add('moveCandidateByName', (name, action, reason = 'Automated test restore') => {
    const optionSelector = {
        shortlist: c.shortlistOption,
        reject: c.rejectOption,
        reconsider: c.reconsiderOption,
    }[action];
    if (!optionSelector) throw new Error(`Unknown candidate action: ${action}`);

    cy.log(`Moving candidate "${name}" via "${action}"`);
    cy.intercept('PATCH', '**/interview/*').as('patchInterviewByName');

    cy.contains(c.rows, name, { timeout: 20000 }).find(c.actionTrigger).click({ force: true });
    cy.get(optionSelector, { timeout: 10000 }).should('be.visible').click();
    cy.get(c.reasonTextarea, { timeout: 10000 }).should('be.visible').clear().type(reason);
    cy.get(c.confirmActionButton).should('not.be.disabled').click();

    cy.wait('@patchInterviewByName', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
    cy.contains('Interview status updated', { timeout: 15000 }).should('be.visible');
});
