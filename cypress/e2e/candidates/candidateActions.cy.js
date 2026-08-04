import { selectors } from '../../support/selectors/selectors';

const c = selectors.candidateActions;

describe('Candidate Actions Tests', () => {
    Cypress.on('uncaught:exception', () => false);

    beforeEach(() => {
        cy.logEnvironmentInfo();
        cy.loginAsAutomationCompany();
        cy.task('logMessage', { message: 'Starting candidate actions test', style: 'green' });
    });

    it('should display candidate scores on the applied-candidates page', () => {
        cy.task('logMessage', { message: 'Test Case: candidate scores are displayed', style: 'blue' });

        cy.openAppliedCandidatesForFirstJob();

        // The Score column always renders as a header
        cy.get(c.headerScore, { timeout: 15000 }).should('be.visible');

        cy.candidateRowCount().then((count) => {
            if (count === 0) {
                cy.task('logMessage', { message: 'First job has no applied candidates — skipping score assertion', style: 'yellow' });
                return;
            }
            // At least one candidate row must show a numeric "N%" score (SVG <text>).
            // Rows still being scored show "Processing" instead — require at least one real score.
            cy.get(c.scoreText, { timeout: 20000 }).should('exist');
            cy.get(c.scoreText).then(($texts) => {
                const scores = [...$texts].map((el) => el.textContent.trim());
                cy.task('logMessage', { message: `Scores found: ${scores.join(', ')}`, style: 'gray' });
                expect(scores.some((s) => /%$/.test(s)), 'at least one candidate shows a % score').to.be.true;
            });
        });

        cy.task('logMessage', { message: 'Candidate scores displayed correctly', style: 'green' });
    });

    it('should shortlist and reject a candidate, verifying each stage move', () => {
        cy.task('logMessage', { message: 'Test Case: shortlist then reject a candidate, verifying moves', style: 'blue' });

        cy.openAppliedCandidatesForFirstJob();

        // Work from the Applied stage so we can move a candidate out and back for each action.
        cy.selectCandidateStage('Applied');

        cy.candidateRowCount().then((count) => {
            if (count === 0) {
                cy.task('logMessage', { message: 'No candidates in Applied stage — skipping move test', style: 'yellow' });
                return;
            }

            // --- Shortlist ---
            // Move the first candidate to Shortlisted (requires an unlocked, scored candidate).
            cy.moveFirstCandidate('shortlist', 'Strong interview — shortlisting (automated test).').then((name) => {
                cy.get('table tbody', { timeout: 15000 }).should('not.contain', name);
                cy.selectCandidateStage('Shortlisted');
                cy.get('table tbody', { timeout: 15000 }).should('contain', name);
                cy.task('logMessage', { message: `Candidate "${name}" moved to Shortlisted successfully`, style: 'green' });

                // Restore to Applied before the next action
                cy.moveCandidateByName(name, 'reconsider', 'Reverting automated test shortlist.');
                cy.get('table tbody', { timeout: 15000 }).should('not.contain', name);
                cy.selectCandidateStage('Applied');
                cy.get('table tbody', { timeout: 15000 }).should('contain', name);

                // --- Reject (same candidate) ---
                cy.moveCandidateByName(name, 'reject', 'Not a fit for this role (automated test).');
                cy.get('table tbody', { timeout: 15000 }).should('not.contain', name);
                cy.selectCandidateStage('Rejected');
                cy.get('table tbody', { timeout: 15000 }).should('contain', name);
                cy.task('logMessage', { message: `Candidate "${name}" moved to Rejected successfully`, style: 'green' });

                // Restore original state — move the candidate back to Applied
                cy.moveCandidateByName(name, 'reconsider', 'Reverting automated test rejection.');
                cy.get('table tbody', { timeout: 15000 }).should('not.contain', name);
                cy.selectCandidateStage('Applied');
                cy.get('table tbody', { timeout: 15000 }).should('contain', name);
                cy.task('logMessage', { message: `Candidate "${name}" restored to Applied`, style: 'green' });
            });
        });
    });
});
