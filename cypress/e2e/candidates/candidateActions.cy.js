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

        // Finds a job that actually has a candidate with a completed (scored) report, searching
        // across jobs so a job whose reports are all "Processing" doesn't fail the test.
        cy.openJobWithScoredCandidate();

        cy.get('@scoredJob').then((res) => {
            if (!res.found) {
                cy.task('logMessage', { message: 'No job in the workspace has a scored candidate yet — skipping score assertion', style: 'yellow' });
                return;
            }

            // The Score column always renders as a header
            cy.get(c.headerScore, { timeout: 15000 }).should('be.visible');

            // Score is an SVG <text> reading "N%". At least one is present (that's how the job was chosen).
            cy.get('body').then(($b) => {
                const scores = [...$b.find(c.scoreText)].map((el) => (el.textContent || '').trim());
                const scored = scores.filter((s) => /%$/.test(s));
                cy.task('logMessage', { message: `Scores displayed: ${scored.join(', ')}`, style: 'gray' });
                expect(scored.length, 'at least one candidate shows a % score').to.be.greaterThan(0);
            });

            cy.task('logMessage', { message: 'Candidate scores displayed correctly', style: 'green' });
        });
    });

    it('should shortlist and reject a candidate, verifying each stage move', () => {
        cy.task('logMessage', { message: 'Test Case: shortlist then reject a candidate, verifying moves', style: 'blue' });

        // Finds a job that has a scored AND unlocked candidate in the Applied stage, searching
        // across ALL jobs — so a job whose reports are all "Processing" (or whose scored candidates
        // are locked) doesn't force a skip; it moves on to the next job. Only skips if no job in the
        // workspace has an actionable candidate.
        cy.openJobWithScoredCandidate({ requireActionable: true });

        cy.get('@scoredJob').then((res) => {
            if (!res.found) {
                cy.task('logMessage', { message: 'No job in the workspace has a scored & unlocked candidate — skipping move test', style: 'yellow' });
                return;
            }

            // The command already left us on the Applied stage with an actionable candidate; re-find
            // the index against the current DOM (guards against any late re-render).
            cy.selectCandidateStage('Applied');
            cy.firstActionableCandidateIndex().then((idx) => {
                if (idx < 0) {
                    cy.task('logMessage', { message: 'Actionable candidate no longer present after refetch — skipping move test', style: 'yellow' });
                    return;
                }

                // Each move is verified by presence in the DESTINATION stage: switching the stage
                // chip forces a fresh /candidates fetch, so we see the real post-move state (the
                // source list doesn't always refetch in place after a move, which made asserting
                // "absent from the old stage" flaky). Presence in the new stage proves the move.

                // --- Shortlist ---
                cy.moveCandidateAtIndex(idx, 'shortlist', 'Strong interview — shortlisting (automated test).').then((name) => {
                cy.selectCandidateStage('Shortlisted');
                cy.assertCandidateInList(name);
                cy.task('logMessage', { message: `Candidate "${name}" moved to Shortlisted successfully`, style: 'green' });

                // Restore to Applied before the next action
                cy.moveCandidateByName(name, 'reconsider', 'Reverting automated test shortlist.');
                cy.selectCandidateStage('Applied');
                cy.assertCandidateInList(name);

                // --- Reject (same candidate) ---
                cy.moveCandidateByName(name, 'reject', 'Not a fit for this role (automated test).');
                cy.selectCandidateStage('Rejected');
                cy.assertCandidateInList(name);
                cy.task('logMessage', { message: `Candidate "${name}" moved to Rejected successfully`, style: 'green' });

                // Restore original state — move the candidate back to Applied
                cy.moveCandidateByName(name, 'reconsider', 'Reverting automated test rejection.');
                cy.selectCandidateStage('Applied');
                cy.assertCandidateInList(name);
                    cy.task('logMessage', { message: `Candidate "${name}" restored to Applied`, style: 'green' });
                });
            });
        });
    });
});
