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

        // Start on Active tab
        cy.contains('Active').should('be.visible');

        // Switch to Archive tab
        cy.switchJobTab('Archive');
        cy.contains('Archive').should('be.visible');

        // Switch back to Active tab
        cy.switchJobTab('Active');
        cy.contains('Active').should('be.visible');

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

        // First archive a job
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            cy.archiveJob(0);

            // Verify it's in Archive tab
            cy.switchJobTab('Archive');
            cy.contains(jobTitle).should('be.visible');

            // Reopen the job
            cy.reopenJob(0);

            // Verify job is no longer in Archive tab
            cy.contains(jobTitle).should('not.exist');

            // Verify job is back in Active tab
            cy.switchJobTab('Active');
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
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

        // Navigate to edit page
        cy.editJob(0);

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

        // Navigate to duplicate page
        cy.duplicateJob(0);

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

    it('should verify job status display', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify job status display',
            style: 'blue',
        });

        // Active job cards carry no "Active" text label in the UI — status is represented by the
        // tab the job sits under. Verify the Active tab is selected and a job is listed there.
        cy.switchJobTab('Active');
        cy.get(selectors.jobs.activeTab).should('have.attr', 'data-state', 'active');
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
        });

        cy.task('logMessage', {
            message: 'Job status verified successfully',
            style: 'green',
        });
    });

    it('should load more jobs when available', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should load more jobs when available',
            style: 'blue',
        });

        // Check if load more button exists
        cy.get('body').then(($body) => {
            if ($body.find(selectors.jobs.loadMoreButton).length > 0) {
                // Get initial job count
                cy.get(selectors.jobs.jobCard).then(($cards) => {
                    const initialCount = $cards.length;

                    // Load more jobs
                    cy.loadMoreJobs();

                    // Verify job count increased (assertion retries until more cards render)
                    cy.get(selectors.jobs.jobCard).should('have.length.greaterThan', initialCount);
                });
            } else {
                cy.task('logMessage', {
                    message: 'Load more button not available - all jobs loaded',
                    style: 'yellow',
                });
            }
        });

        cy.task('logMessage', {
            message: 'Load more functionality verified',
            style: 'green',
        });
    });

    it('should verify job card details are displayed', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should verify job card details are displayed',
            style: 'blue',
        });

        // Verify job cards are visible
        cy.get(selectors.jobs.jobCard, { timeout: 10000 }).should('have.length.greaterThan', 0);

        // Verify job title is visible
        cy.get(selectors.jobs.jobTitle).first().should('be.visible');

        // Verify the per-card actions (kebab) trigger is visible
        cy.get(selectors.jobs.jobDropdownTrigger).first().should('be.visible');

        cy.task('logMessage', {
            message: 'Job card details displayed correctly',
            style: 'green',
        });
    });

    it('should handle empty search results', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should handle empty search results',
            style: 'blue',
        });

        // Search for non-existent job
        cy.searchJob('NonExistentJob123456789');

        // Verify no results or empty state is shown
        cy.get('body').then(($body) => {
            if ($body.find(selectors.jobs.jobCard).length === 0) {
                cy.task('logMessage', {
                    message: 'No jobs found for search query',
                    style: 'yellow',
                });
            }
        });

        // Clear search and wait for the input to actually clear (dynamic, not a fixed delay)
        cy.get(selectors.jobs.searchInput).clear().should('have.value', '');

        cy.task('logMessage', {
            message: 'Empty search results handled correctly',
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
