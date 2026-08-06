import { selectors } from '../selectors/selectors';

const c = selectors.candidateActions;

// Scan the currently-rendered job cards for the first with "Total Candidates: N" (N > 0).
// Yields that card's index, or -1 if none of the loaded cards report candidates.
Cypress.Commands.add('firstJobCardWithCandidates', () => {
    return cy.get(selectors.jobs.jobCard).then(($cards) => {
        let idx = -1;
        $cards.each((i, el) => {
            const m = Cypress.$(el).text().match(/Total Candidates:\s*(\d+)/i);
            if (idx < 0 && m && parseInt(m[1], 10) > 0) idx = i;
        });
        return idx;
    });
});

// From /create-job, auto-pick the FIRST job card that actually has candidates (each card shows
// "Total Candidates: N") and open its applied-candidates page via that card's "View All".
// If no loaded card has candidates, keep clicking "Load More Jobs" and re-scanning until one is
// found or there are no more pages. Falls back to the first job if none ever report candidates
// (tests then skip via their row-count guard).
Cypress.Commands.add('openAppliedCandidatesForJobWithCandidates', () => {
    cy.log('Opening applied candidates for the first job that has candidates');
    cy.visit('/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 30000 }).should('be.visible');
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', 0);

    // The per-card "Total Candidates: N" only renders after the interview_counts load asynchronously.
    // Wait for it to appear before scanning, otherwise every card reads as having no count.
    cy.contains('Total Candidates:', { timeout: 30000 }).should('exist');

    // Scan the loaded page; if nothing has candidates, load the next page and scan again.
    const scanOrLoadMore = () => {
        cy.firstJobCardWithCandidates().then((idx) => {
            if (idx >= 0) {
                cy.task('logMessage', { message: `Opening applied candidates for job #${idx + 1} (has candidates)`, style: 'gray' });
                openViewAll(idx);
                return;
            }

            // Nothing on this page — try to load more jobs and re-scan. The end-of-list button
            // stays in the DOM but disabled, so only treat an ENABLED button as "more pages".
            cy.get('body').then(($b) => {
                const hasMore = $b.find(selectors.jobs.loadMoreButton).not(':disabled').length > 0;
                if (hasMore) {
                    cy.task('logMessage', { message: 'No candidates on the loaded jobs — clicking "Load More Jobs" and re-scanning', style: 'yellow' });
                    cy.get(selectors.jobs.jobCard).its('length').then((before) => {
                        cy.get(selectors.jobs.loadMoreButton).scrollIntoView().should('not.be.disabled').click();
                        // Wait for the next page to render before re-scanning.
                        cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', before);
                        scanOrLoadMore();
                    });
                } else {
                    cy.task('logMessage', { message: 'No job reports any candidates across all pages — falling back to the first job', style: 'yellow' });
                    openViewAll(0);
                }
            });
        });
    };

    const openViewAll = (idx) => {
        cy.intercept('GET', '**/candidates?*').as('getCandidates');
        cy.get(selectors.jobs.jobCard).eq(idx).contains('button', 'View All').first().scrollIntoView().click();
        cy.url({ timeout: 15000 }).should('include', '/applied-candidates');
        cy.wait('@getCandidates', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    };

    scanOrLoadMore();
});

// Open a job's applied-candidates page that ACTUALLY has a scored candidate (a completed report,
// i.e. a "N%" score is displayed) — not merely a job with candidates. A job can have candidates
// whose reports are all still "Processing"; those are useless for the score/action tests. This
// command:
//   1. reads every job's id + candidate count from the jobs API (paging through "Load More Jobs"),
//   2. visits each candidate-having job (most candidates first) directly via
//      /applied-candidates?job_id=<id>, and
//   3. stops on the FIRST job that shows a "%" score; leaving that page open for the test.
// It aliases the outcome as `@scoredJob` ({ found, job?, reason? }) so callers can skip gracefully
// only when NO job across the workspace has a scored candidate.
//
// Pass { requireActionable: true } when the caller needs to actually MOVE a candidate (shortlist/
// reject): the search then only accepts a job that has a scored AND unlocked candidate in the
// Applied stage (firstActionableCandidateIndex >= 0), so a job whose scored candidates are all
// locked/paywalled is skipped in favour of the next job. Without it, any displayed "%" score wins.
Cypress.Commands.add('openJobWithScoredCandidate', (opts = {}) => {
    const requireActionable = !!opts.requireActionable;
    cy.log(`Searching for a job with a ${requireActionable ? 'scored & actionable' : 'scored'} candidate`);
    cy.intercept('GET', '**/get-jobs-by-workspace/*').as('jobsList');
    cy.visit('/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 30000 }).should('be.visible');
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', 0);
    // First /create-job load can be slow in CI — the per-card "Total Candidates:" only renders once
    // the jobs (with interview_counts) resolve. Allow generous time before scanning.
    cy.contains('Total Candidates:', { timeout: 60000 }).should('exist');

    // Expand every page so the jobsList intercept captures all jobs (with their _id + counts).
    // At the end of the list the "Load More Jobs" button stays in the DOM but becomes DISABLED, so
    // only click it while it's enabled — a disabled (or absent) button means no more pages.
    const loadAllPages = () => {
        cy.get('body').then(($b) => {
            const hasMore = $b.find(selectors.jobs.loadMoreButton).not(':disabled').length > 0;
            if (hasMore) {
                cy.get(selectors.jobs.jobCard).its('length').then((before) => {
                    cy.get(selectors.jobs.loadMoreButton).scrollIntoView().should('not.be.disabled').click();
                    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', before);
                    loadAllPages();
                });
            }
        });
    };
    loadAllPages();

    cy.get('@jobsList.all', { timeout: 30000 }).then((calls) => {
        // The jobs API returns jobs latest-first (sorted by updated_at desc — the same order the
        // cards appear in on /create-job) and @jobsList.all preserves that order across pages, so
        // keep it as-is: we want the LATEST job with a completed report, not the one with the most
        // candidates. Just drop jobs that have no candidates at all.
        const jobs = calls.flatMap((call) => call?.response?.body?.jobs || []);
        const candidateJobs = jobs.filter((j) => (j?.interview_counts?.total ?? 0) > 0);

        if (candidateJobs.length === 0) {
            cy.task('logMessage', { message: 'No job in the workspace has any candidates', style: 'yellow' });
            cy.wrap({ found: false, reason: 'no-candidates' }).as('scoredJob');
            return;
        }

        cy.task('logMessage', {
            message: `${candidateJobs.length} job(s) have candidates — checking each for a scored report`,
            style: 'gray',
        });

        const tryJob = (i) => {
            if (i >= candidateJobs.length) {
                cy.task('logMessage', {
                    message: 'No job has a scored candidate yet (all reports still Processing) — nothing actionable',
                    style: 'yellow',
                });
                cy.wrap({ found: false, reason: 'all-processing' }).as('scoredJob');
                return;
            }

            const job = candidateJobs[i];
            cy.task('logMessage', {
                message: `Checking job "${job.title}" (${job.interview_counts.total} candidate(s)) for a completed report`,
                style: 'gray',
            });

            cy.intercept('GET', '**/candidates?*').as('getCandidates');
            cy.visit(`/applied-candidates?job_id=${job._id}`);
            cy.url({ timeout: 15000 }).should('include', '/applied-candidates');
            cy.wait('@getCandidates', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
            // Wait for the list to finish rendering (shimmer skeletons cleared) so the score cells
            // and kebabs are the loaded ones, not the loading placeholders.
            cy.waitForCandidateListLoaded();

            if (requireActionable) {
                // The caller will move a candidate — accept this job only if it has a scored AND
                // unlocked candidate in the Applied stage. Work from the Applied stage explicitly so
                // firstActionableCandidateIndex sees movable rows (selectCandidateStage waits for the
                // stage's candidates to load).
                cy.selectCandidateStage('Applied');
                cy.firstActionableCandidateIndex().then((idx) => {
                    if (idx >= 0) {
                        cy.task('logMessage', { message: `Found a scored & actionable candidate (row ${idx}) in job "${job.title}"`, style: 'green' });
                        cy.wrap({ found: true, job, actionableIndex: idx }).as('scoredJob');
                    } else {
                        cy.task('logMessage', { message: `Job "${job.title}" has no scored & unlocked candidate in Applied — trying the next job`, style: 'gray' });
                        tryJob(i + 1);
                    }
                });
                return;
            }

            // Score-only mode: accept the job if ANY row displays a "%" score.
            cy.get('body').then(($b) => {
                const hasScore = [...$b.find(c.scoreText)].some((el) => /%$/.test((el.textContent || '').trim()));
                if (hasScore) {
                    cy.task('logMessage', { message: `Found a scored candidate in job "${job.title}"`, style: 'green' });
                    cy.wrap({ found: true, job }).as('scoredJob');
                } else {
                    cy.task('logMessage', { message: `Job "${job.title}" has no scored report yet — trying the next job`, style: 'gray' });
                    tryJob(i + 1);
                }
            });
        };

        tryJob(0);
    });
});

// Wait for the applied-candidates list to finish loading. While a stage is fetching, the real
// <table> is unmounted and replaced by shimmer skeletons (animate-pulse, the only use of that class
// on this page). Wait for those to clear and the table to render so reads (scores/kebabs) see the
// loaded DOM rather than the skeleton or the previous stage's rows.
Cypress.Commands.add('waitForCandidateListLoaded', () => {
    cy.get('.animate-pulse', { timeout: 20000 }).should('not.exist');
    cy.get(selectors.candidateActions.table, { timeout: 20000 }).should('exist');
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
        } else {
            cy.wait('@getCandidatesByStage', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
        }
    });
    // Whether or not it refetched, wait for the list to be rendered (shimmer cleared, table present)
    // before returning, so the candidates for this stage are actually loaded.
    cy.waitForCandidateListLoaded();
});

// Assert a candidate IS present in the current stage list, matching the row name <h6> EXACTLY.
// Candidate names are sequential ("Remotebase 119", "Remotebase 1190", …), so a substring
// `contains` match is unreliable — "Remotebase 119" is a substring of "Remotebase 1190".
Cypress.Commands.add('assertCandidateInList', (name, timeout = 15000) => {
    cy.get('table tbody', { timeout }).should(($tb) => {
        const names = [...$tb.find('h6')].map((el) => (el.textContent || '').trim());
        expect(names, `candidate "${name}" present in list`).to.include(name);
    });
});

// Assert a candidate is NOT present in the current stage list, matching the row name <h6> EXACTLY.
Cypress.Commands.add('assertCandidateNotInList', (name, timeout = 15000) => {
    cy.get('table tbody', { timeout }).should(($tb) => {
        const names = [...$tb.find('h6')].map((el) => (el.textContent || '').trim());
        expect(names, `candidate "${name}" absent from list`).to.not.include(name);
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
        // Assert the success toast, then click to dismiss it (closeOnClick). react-toastify dedups
        // by message id (= this text), so clearing it now lets the next action render a fresh toast.
        cy.contains('Interview status updated', { timeout: 15000 }).should('be.visible').click({ force: true });
        cy.contains('Interview status updated').should('not.exist');

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
    // Assert the success toast, then click to dismiss it (closeOnClick) so a follow-up action's
    // identical toast isn't suppressed by react-toastify's message-id dedup.
    cy.contains('Interview status updated', { timeout: 15000 }).should('be.visible').click({ force: true });
    cy.contains('Interview status updated').should('not.exist');
});
