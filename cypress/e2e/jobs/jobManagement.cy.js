import { selectors } from '../../support/selectors/selectors';

describe('Job Management Tests', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    beforeEach(() => {
        // Login before each test
        cy.loginAsAutomationCompany();
        cy.navigateToJobListing();
    });

    it('should display job listing page with tabs', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should display job listing page with tabs',
            style: 'blue',
        });

        // Verify page loads
        cy.url().should('include', '/create-job');

        // Verify tabs are visible
        cy.contains('Active').should('be.visible');
        cy.contains('Archive').should('be.visible');

        // Verify search input is visible
        cy.get(selectors.jobs.searchInput).should('be.visible');

        cy.task('logMessage', {
            message: 'Job listing page displayed successfully with tabs',
            style: 'green',
        });
    });

    it('should search for jobs using search bar', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should search for jobs using search bar',
            style: 'blue',
        });

        // Get a job title from the list first
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            // Search for the job
            cy.searchJob(jobTitle);

            // Verify search results show the job (assertion retries — no fixed wait needed)
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');

            // Clear search
            cy.get(selectors.jobs.searchInput, { timeout: 10000 }).clear();
        });

        cy.task('logMessage', {
            message: 'Job search functionality working correctly',
            style: 'green',
        });
    });

    it('should switch between Active and Archive tabs', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should switch between Active and Archive tabs',
            style: 'blue',
        });

        // Mutation-free tab check: assert the Radix tab actually becomes the active one.
        // (switchJobTab asserts data-state=active internally; assert the inactive side too.)
        cy.switchJobTab('Archive');
        cy.get(selectors.jobs.activeTab).should('have.attr', 'data-state', 'inactive');

        cy.switchJobTab('Active');
        cy.get(selectors.jobs.archiveTab).should('have.attr', 'data-state', 'inactive');

        cy.task('logMessage', {
            message: 'Tab switching functionality working correctly',
            style: 'green',
        });
    });

    it('should archive a job and verify it moves to Archive tab', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should archive a job and verify it moves to Archive tab',
            style: 'blue',
        });

        // The list is paginated (only a page of cards is rendered) and titles are NOT unique, so
        // verify via the Active tab's TOTAL count (e.g. "Active Jobs 50"), not visible card count.
        // Wait until the count has actually loaded (> 0) before capturing it.
        cy.get(selectors.jobs.activeTab)
            .should(($t) => expect(parseInt($t.text().replace(/\D/g, ''), 10)).to.be.greaterThan(0))
            .invoke('text')
            .then((text) => {
                const activeCountBefore = parseInt(text.replace(/\D/g, ''), 10);

                cy.getJobTitleByIndex(0).then((jobTitle) => {
                    // Archive the job
                    cy.archiveJob(0);

                    // Active total should drop by one (retries until the refetch settles)
                    cy.get(selectors.jobs.activeTab, { timeout: 15000 }).should(($t) => {
                        const now = parseInt($t.text().replace(/\D/g, ''), 10);
                        expect(now, 'active job count after archive').to.be.lessThan(activeCountBefore);
                    });

                    // Verify the job now appears under the Archive tab
                    cy.switchJobTab('Archive');
                    cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');

                    // Clean up - reopen the first archived job
                    cy.reopenJob(0);
                });
            });

        cy.task('logMessage', {
            message: 'Job archived and moved to Archive tab successfully',
            style: 'green',
        });
    });

    it('should reopen archived job and verify it moves back to Active tab', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should reopen archived job and verify it moves back to Active tab',
            style: 'blue',
        });

        const countOf = ($t) => parseInt($t.text().replace(/\D/g, ''), 10);

        // Titles are NOT unique (other specs create jobs with repeating titles), so verifying by
        // "title disappears from Archive" is unreliable — another archived job with the same title
        // can remain. Verify via the ACTIVE tab TOTAL instead: archiving drops it by one and
        // reopening restores it. (The Archive badge count doesn't refetch in place after a reopen
        // while you stay on the Archive tab, so we don't rely on it.)

        // Ensure there's an archived job to reopen: archive one first and capture the active total.
        cy.get(selectors.jobs.activeTab)
            .should(($t) => expect(countOf($t)).to.be.greaterThan(0))
            .invoke('text')
            .then((text) => {
                const activeCountBefore = parseInt(text.replace(/\D/g, ''), 10);

                cy.archiveJob(0);

                // Active total should drop by one after archiving (retries until refetch settles).
                cy.get(selectors.jobs.activeTab, { timeout: 15000 }).should(($t) => {
                    expect(countOf($t), 'active job count after archive').to.be.lessThan(activeCountBefore);
                });

                // Reopen the first archived job.
                cy.switchJobTab('Archive');
                cy.reopenJob(0);

                // Active total should climb back to where it started (retries until refetch settles).
                cy.switchJobTab('Active');
                cy.get(selectors.jobs.activeTab, { timeout: 15000 }).should(($t) => {
                    expect(countOf($t), 'active job count after reopen').to.eq(activeCountBefore);
                });
            });

        cy.task('logMessage', {
            message: 'Job reopened and moved back to Active tab successfully',
            style: 'green',
        });
    });

    it('should navigate to edit job page', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should navigate to edit job page',
            style: 'blue',
        });

        // A Dynamic job routes to /edit-dynamic-interview, so target the first FIXED job
        // (paging through "Load More Jobs" if needed) to reliably assert the /edit-job route.
        cy.firstFixedJobIndexAcrossPages().then((idx) => {
            expect(idx, 'a Fixed job exists to edit').to.be.greaterThan(-1);
            cy.editJob(idx);
        });

        // Verify we're on edit page
        cy.url().should('include', '/edit-job');

        // Navigate back to job listing (wait for the listing to be ready, not a fixed delay)
        cy.visit('/create-job');
        cy.get(selectors.jobs.activeTab, { timeout: 10000 }).should('be.visible');

        cy.task('logMessage', {
            message: 'Navigated to edit job page successfully',
            style: 'green',
        });
    });

    it('should navigate to duplicate job page', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should navigate to duplicate job page',
            style: 'blue',
        });

        // A Dynamic job routes to /duplicate-dynamic-interview, so target the first FIXED job
        // (paging through "Load More Jobs" if needed) to reliably assert the /duplicate-job route.
        cy.firstFixedJobIndexAcrossPages().then((idx) => {
            expect(idx, 'a Fixed job exists to duplicate').to.be.greaterThan(-1);
            cy.duplicateJob(idx);
        });

        // Verify we're on duplicate page
        cy.url().should('include', '/duplicate-job');

        // Navigate back to job listing (wait for the listing to be ready, not a fixed delay)
        cy.visit('/create-job');
        cy.get(selectors.jobs.activeTab, { timeout: 10000 }).should('be.visible');

        cy.task('logMessage', {
            message: 'Navigated to duplicate job page successfully',
            style: 'green',
        });
    });

    // SKIPPED: deleting a job is PERMANENT (no undo, unlike archive) and would destroy a real
    // job in the workspace on every run. Deletion is also async (marked_for_deletion) and, because
    // job titles are not unique, would remove an arbitrary matching job. Enable only against a
    // dedicated throwaway job. The cy.deleteJob command types the job title into the confirm modal.
    it.skip('should delete a job', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should delete a job',
            style: 'blue',
        });

        // Get job count and the title (needed to confirm deletion) before deleting
        cy.get(selectors.jobs.jobCard).then(($cards) => {
            const initialCount = $cards.length;

            cy.getJobTitleByIndex(0).then((jobTitle) => {
                // Delete the job (delete modal requires typing the exact title to confirm)
                cy.deleteJob(0, jobTitle);

                // Verify job count decreased
                cy.get(selectors.jobs.jobCard, { timeout: 10000 })
                    .should('have.length.lessThan', initialCount);
            });
        });

        cy.task('logMessage', {
            message: 'Job deleted successfully',
            style: 'green',
        });
    });

    it('should reflect job status through the per-card menu options', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should reflect job status through the per-card menu options',
            style: 'blue',
        });

        // Job cards have no textual status label — status is expressed by which tab the job sits
        // under AND by the kebab menu: an ACTIVE job offers "Archive Job" (and no reopen), an
        // ARCHIVED job offers "Active Job" (reopen, and no archive). Both menu items are always in
        // the DOM; the app toggles them with a `hidden` class, so assert visibility (not existence).
        cy.switchJobTab('Active');
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            // Active job -> Archive visible, reopen hidden
            cy.openJobDropdown(0);
            cy.get(selectors.jobs.archiveOption, { timeout: 5000 }).should('be.visible');
            cy.get(selectors.jobs.activeOption).should('not.be.visible');
            cy.get('body').type('{esc}');

            // Flip it to archived, then assert the menu now exposes reopen and hides archive
            cy.archiveJob(0);
            cy.switchJobTab('Archive');
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
            cy.openJobDropdown(0);
            cy.get(selectors.jobs.activeOption, { timeout: 5000 }).should('be.visible');
            cy.get(selectors.jobs.archiveOption).should('not.be.visible');
            cy.get('body').type('{esc}');

            // Restore original state
            cy.reopenJob(0);
        });

        cy.task('logMessage', {
            message: 'Job status affordances verified for active and archived jobs',
            style: 'green',
        });
    });

    it('should show Load More only when the total exceeds the rendered page', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should show Load More only when the total exceeds the rendered page',
            style: 'blue',
        });

        // The Active tab label carries the true total (e.g. "Active Jobs 50"). Compare it to the
        // number of cards actually rendered to derive whether Load More MUST exist — then assert
        // it, so both branches carry a real assertion (the old test's else-branch asserted nothing).
        cy.switchJobTab('Active');
        cy.get(selectors.jobs.activeTab)
            .should(($t) => expect(parseInt($t.text().replace(/\D/g, ''), 10)).to.be.greaterThan(0))
            .invoke('text')
            .then((text) => {
                const totalActive = parseInt(text.replace(/\D/g, ''), 10);

                cy.get(selectors.jobs.jobCard).then(($cards) => {
                    const rendered = $cards.length;

                    if (rendered < totalActive) {
                        // More jobs exist than are rendered -> button must be present and must work.
                        // It sits at the bottom of a scrollable (overflow) container, so scroll it
                        // into view before asserting visibility / clicking.
                        cy.get(selectors.jobs.loadMoreButton).should('exist').scrollIntoView().should('be.visible');
                        cy.loadMoreJobs();
                        cy.get(selectors.jobs.jobCard).should('have.length.greaterThan', rendered);
                    } else {
                        // Everything is already on screen -> the button must NOT be present.
                        cy.get(selectors.jobs.loadMoreButton).should('not.exist');
                    }
                });
            });

        cy.task('logMessage', {
            message: 'Load More visibility matches total vs rendered count',
            style: 'green',
        });
    });

    it('should display the key fields on a job card', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should display the key fields on a job card',
            style: 'blue',
        });

        cy.get(selectors.jobs.jobCard, { timeout: 10000 }).should('have.length.greaterThan', 0);

        // Assert the actual content of the first card — title, interview-type badge, the three
        // candidate stat tiles, the total, and a correctly formatted last-updated date — rather
        // than only that generic elements exist. All of these render for both draft and published
        // cards (only the interview-link block is draft-conditional), so this is stable per card.
        cy.get(selectors.jobs.jobCard).first().within(() => {
            // Title present and non-empty (ignoring any [Draft] prefix)
            cy.get('h5').first().should('be.visible').invoke('text').then((t) => {
                expect(t.replace('[Draft]', '').trim(), 'job title').to.not.be.empty;
            });

            // Interview-type badge: every card shows exactly "Dynamic" or "Fixed"
            cy.contains(/^(Dynamic|Fixed)$/).should('be.visible');

            // Candidate stat tiles
            cy.contains('Applied').should('be.visible');
            cy.contains('Shortlisted').should('be.visible');
            cy.contains('Rejected').should('be.visible');

            // Aggregate count + last-updated timestamp (asserted in dd/MM/yyyy format)
            cy.contains('Total Candidates:').should('be.visible');
            cy.contains('Last Updated:')
                .should('be.visible')
                .invoke('text')
                .should('match', /\d{2}\/\d{2}\/\d{4}/);

            // Per-card actions (kebab) trigger
            cy.get(selectors.jobs.jobDropdownTrigger).should('be.visible');
        });

        cy.task('logMessage', {
            message: 'Job card renders title, type, stat tiles, total and last-updated date',
            style: 'green',
        });
    });

    it('should show a no-results message for a search with no matches', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should show a no-results message for a search with no matches',
            style: 'blue',
        });

        // The top-bar search is a GLOBAL dropdown search (jobs/candidates/users) — it does NOT
        // filter the job-list cards below. On a term with no matches it renders an explicit
        // "No results found for "<term>"" empty state inside the dropdown.
        const term = 'NonExistentJob123456789';
        cy.get(selectors.jobs.searchInput, { timeout: 10000 }).clear().type(term).should('have.value', term);

        cy.contains(`No results found for "${term}"`, { timeout: 15000 }).should('be.visible');

        // Clearing the query removes the empty-state message.
        cy.get(selectors.jobs.searchInput).clear().should('have.value', '');
        cy.contains('No results found for').should('not.exist');

        cy.task('logMessage', {
            message: 'Global search shows a no-results message and clears correctly',
            style: 'green',
        });
    });

    it('should verify archive modal displays correct information', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify archive modal displays correct information',
            style: 'blue',
        });

        // Open dropdown and click archive
        cy.openJobDropdown(0);
        cy.get(selectors.jobs.archiveOption, { timeout: 5000 }).click();

        // Verify modal is visible
        cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('be.visible');

        // Verify modal title
        cy.contains('close this job position', { timeout: 5000 }).should('be.visible');

        // Verify modal has confirmation (Yes) and cancel (No) controls
        cy.get(selectors.jobs.switchStatusConfirmButton).should('be.visible');
        cy.get(selectors.jobs.switchStatusCancelButton).should('be.visible');

        // Cancel the action
        cy.get(selectors.jobs.switchStatusCancelButton).click();
        cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('not.exist');

        cy.task('logMessage', {
            message: 'Archive modal displays correct information',
            style: 'green',
        });
    });

    it('should verify reopen modal displays correct information', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify reopen modal displays correct information',
            style: 'blue',
        });

        // First archive a job to test reopen
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            cy.archiveJob(0);

            // Switch to Archive tab
            cy.switchJobTab('Archive');

            // Open dropdown and click active/reopen
            cy.openJobDropdown(0);
            cy.get(selectors.jobs.activeOption, { timeout: 5000 }).click();

            // Verify modal is visible
            cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('be.visible');

            // Verify modal title
            cy.contains('reopen this job position', { timeout: 5000 }).should('be.visible');

            // Confirm the action (Yes)
            cy.get(selectors.jobs.switchStatusConfirmButton).click();
            cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('not.exist');

            // Switch back to Active tab
            cy.switchJobTab('Active');
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
        });

        cy.task('logMessage', {
            message: 'Reopen modal displays correct information',
            style: 'green',
        });
    });
});
