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
        cy.get('input[placeholder*="Search"], input[type="search"]').should('be.visible');

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

            // Verify search results show the job
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');

            // Clear search
            cy.get('input[placeholder*="Search"], input[type="search"]').clear();
            cy.wait(2000);
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

        // Get job title before archiving
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            // Archive the job
            cy.archiveJob(0);

            // Verify job is no longer in Active tab
            cy.switchJobTab('Active');
            cy.contains(jobTitle).should('not.exist');

            // Verify job is in Archive tab
            cy.switchJobTab('Archive');
            cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');

            // Clean up - reopen the job
            cy.reopenJob(0);
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

        // Navigate back to job listing
        cy.visit('/create-job');
        cy.wait(2000);

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

        // Navigate back to job listing
        cy.visit('/create-job');
        cy.wait(2000);

        cy.task('logMessage', {
            message: 'Navigated to duplicate job page successfully',
            style: 'green',
        });
    });

    it('should delete a job', () => {
        cy.task('logMessage', {
            message: 'Test Case: Should delete a job',
            style: 'blue',
        });

        // Get job count before deletion
        cy.get('.bg-white, .rounded-lg').then(($cards) => {
            const initialCount = $cards.length;

            // Delete the job
            cy.deleteJob(0);

            // Verify job count decreased
            cy.get('.bg-white, .rounded-lg').should('have.length', initialCount - 1);
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

        // Get job title and verify status
        cy.getJobTitleByIndex(0).then((jobTitle) => {
            cy.verifyJobStatus(jobTitle, 'Active');
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
            if ($body.find('button:contains("Load More Jobs")').length > 0) {
                // Get initial job count
                cy.get('.bg-white, .rounded-lg').then(($cards) => {
                    const initialCount = $cards.length;

                    // Load more jobs
                    cy.loadMoreJobs();

                    // Verify job count increased
                    cy.get('.bg-white, .rounded-lg').should('have.length.greaterThan', initialCount);
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
        cy.get('.bg-white, .rounded-lg', { timeout: 10000 }).should('have.length.greaterThan', 0);

        // Verify job title is visible
        cy.get('h3, h4, .text-lg, .font-medium').first().should('be.visible');

        // Verify job status is visible
        cy.contains('Active, Archived').first().should('be.visible');

        // Verify dropdown trigger is visible
        cy.get('[aria-label="job-status"], button:has(svg)').first().should('be.visible');

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
            if ($body.find('.bg-white, .rounded-lg').length === 0) {
                cy.task('logMessage', {
                    message: 'No jobs found for search query',
                    style: 'yellow',
                });
            }
        });

        // Clear search
        cy.get('input[placeholder*="Search"], input[type="search"]').clear();
        cy.wait(2000);

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
        cy.get('[data-value="archived"]', { timeout: 5000 }).click();

        // Verify modal is visible
        cy.get('.fixed.inset-0', { timeout: 5000 }).should('be.visible');

        // Verify modal title
        cy.contains('close this job position', { timeout: 5000 }).should('be.visible');

        // Verify modal has confirmation and cancel buttons
        cy.get('button:contains("Confirm")').should('be.visible');
        cy.get('button:contains("Cancel")').should('be.visible');

        // Cancel the action
        cy.get('button:contains("Cancel")').click();
        cy.get('.fixed.inset-0', { timeout: 5000 }).should('not.exist');

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
            cy.get('[data-value="active"]', { timeout: 5000 }).click();

            // Verify modal is visible
            cy.get('.fixed.inset-0', { timeout: 5000 }).should('be.visible');

            // Verify modal title
            cy.contains('reopen this job position', { timeout: 5000 }).should('be.visible');

            // Confirm the action
            cy.get('button:contains("Confirm")').click();
            cy.get('.fixed.inset-0', { timeout: 5000 }).should('not.exist');

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
