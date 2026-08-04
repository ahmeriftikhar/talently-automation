import { selectors } from '../selectors/selectors';

const c = selectors.candidateActions;

// From /create-job, auto-pick the FIRST job card that actually has candidates (each card shows
// "Total Candidates: N") and open its applied-candidates page via that card's "View All".
// Falls back to the first job if none report candidates (tests then skip via their row-count guard).
Cypress.Commands.add('openAppliedCandidatesForJobWithCandidates', () => {
    cy.log('Opening applied candidates for the first job that has candidates');
    cy.visit('/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 30000 }).should('be.visible');
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', 0);

    // The per-card "Total Candidates: N" only renders after the interview_counts load asynchronously.
    // Wait for it to appear before scanning, otherwise every card reads as having no count.
    cy.contains('Total Candidates:', { timeout: 30000 }).should('exist');

    cy.get(selectors.jobs.jobCard).then(($cards) => {
        let idx = -1;
        $cards.each((i, el) => {
            const m = Cypress.$(el).text().match(/Total Candidates:\s*(\d+)/i);
            if (idx < 0 && m && parseInt(m[1], 10) > 0) idx = i;
        });

        if (idx < 0) {
            cy.task('logMessage', { message: 'No job reports any candidates — falling back to the first job', style: 'yellow' });
            idx = 0;
        } else {
            cy.task('logMessage', { message: `Opening applied candidates for job #${idx + 1} (has candidates)`, style: 'gray' });
        }

        cy.intercept('GET', '**/candidates?*').as('getCandidates');
        cy.get(selectors.jobs.jobCard).eq(idx).contains('button', 'View All').first().scrollIntoView().click();

        cy.url({ timeout: 15000 }).should('include', '/applied-candidates');
        cy.wait('@getCandidates', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    });
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

// Yield the index of the first ACTIONABLE candidate row — one whose interview report is scored
// (Score cell shows "N%", not "Processing") AND whose action kebab is enabled (unlocked, not
// paywalled). Yields -1 when no row is actionable (e.g. all reports still compiling). Callers
// should skip gracefully on -1 rather than fail — it's a data/timing condition, not a bug.
Cypress.Commands.add('firstActionableCandidateIndex', () => {
    return cy.get('body').then(($b) => {
        const rows = $b.find(c.rows);
        let idx = -1;
        rows.each((i, tr) => {
            if (idx >= 0) return;
            const $tr = Cypress.$(tr);
            const scored = [...$tr.find('svg text')].some((el) => /%$/.test((el.textContent || '').trim()));
            const trigger = $tr.find(c.actionTrigger).closest('button');
            const enabled = trigger.length > 0 && !trigger.is(':disabled');
            if (scored && enabled) idx = i;
        });
        return idx;
    });
});

// Move the candidate at row `index` via the given action, providing the required reason.
// `action` = 'shortlist' | 'reject' | 'reconsider'. Yields the moved candidate's name.
// Use with firstActionableCandidateIndex() so the target row is scored & unlocked.
Cypress.Commands.add('moveCandidateAtIndex', (index, action, reason = 'Automated test action') => {
    const optionSelector = {
        shortlist: c.shortlistOption,
        reject: c.rejectOption,
        reconsider: c.reconsiderOption,
    }[action];
    if (!optionSelector) throw new Error(`Unknown candidate action: ${action}`);

    cy.log(`Moving candidate at row ${index} via "${action}"`);

    // Capture the row's candidate name (from the name <h6>) for later assertions.
    return cy.get(c.rows, { timeout: 20000 }).eq(index).find('h6').first().invoke('text').then((rawName) => {
        const name = rawName.trim();

        cy.intercept('PATCH', '**/interview/*').as('patchInterview');

        // Open the row's kebab (trigger is enabled — unlocked & scored candidate)
        cy.get(c.rows).eq(index).find(c.actionTrigger).should('be.visible').click({ force: true });

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
