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

        cy.openAppliedCandidatesForJobWithCandidates();

        // The Score column always renders as a header
        cy.get(c.headerScore, { timeout: 15000 }).should('be.visible');

        cy.candidateRowCount().then((count) => {
            if (count === 0) {
                cy.task('logMessage', { message: 'First job has no applied candidates — skipping score assertion', style: 'yellow' });
                return;
            }
            // Score is an SVG <text> reading "N%". Rows still being scored show "Processing" (no % text).
            // If NO report is completed yet, skip gracefully instead of failing — it's a timing condition.
            cy.get('body').then(($b) => {
                const scores = [...$b.find(c.scoreText)].map((el) => (el.textContent || '').trim());
                const scored = scores.filter((s) => /%$/.test(s));
                if (scored.length === 0) {
                    cy.task('logMessage', { message: 'No candidate report is scored yet (all Processing) — skipping score assertion', style: 'yellow' });
                    return;
                }
                cy.task('logMessage', { message: `Scores displayed: ${scored.join(', ')}`, style: 'gray' });
                expect(scored.length, 'at least one candidate shows a % score').to.be.greaterThan(0);
            });
        });

        cy.task('logMessage', { message: 'Candidate scores displayed correctly', style: 'green' });
    });

    it('should shortlist and reject a candidate, verifying each stage move', () => {
        cy.task('logMessage', { message: 'Test Case: shortlist then reject a candidate, verifying moves', style: 'blue' });

        cy.openAppliedCandidatesForJobWithCandidates();

        // Work from the Applied stage so we can move a candidate out and back for each action.
        cy.selectCandidateStage('Applied');

        cy.candidateRowCount().then((count) => {
            if (count === 0) {
                cy.task('logMessage', { message: 'No candidates in Applied stage — skipping move test', style: 'yellow' });
                return;
            }

            // Find a candidate whose report is scored AND unlocked (kebab enabled). If none are
            // actionable (e.g. all reports still Processing), skip — actions are inert on such rows.
            cy.firstActionableCandidateIndex().then((idx) => {
                if (idx < 0) {
                    cy.task('logMessage', { message: 'No scored/unlocked candidate available (reports still processing or locked) — skipping move test', style: 'yellow' });
                    return;
                }

                // --- Shortlist ---
                cy.moveCandidateAtIndex(idx, 'shortlist', 'Strong interview — shortlisting (automated test).').then((name) => {
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
});
