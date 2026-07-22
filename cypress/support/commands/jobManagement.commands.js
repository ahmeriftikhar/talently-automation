import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

// Navigate to job listing page
Cypress.Commands.add('navigateToJobListing', () => {
    cy.log('Navigating to job listing page');
    cy.visit(selectors.jobs.jobListingPage);
    cy.url().should('include', '/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 10000 }).should('be.visible');
});

// Search for a job
Cypress.Commands.add('searchJob', (searchTerm) => {
    cy.log(`Searching for job: ${searchTerm}`);
    cy.get(selectors.jobs.searchInput, { timeout: 10000 }).clear().type(searchTerm);
    cy.wait(2000); // Wait for search results to load
});

// Switch between Active and Archive tabs
Cypress.Commands.add('switchJobTab', (tab) => {
    cy.log(`Switching to ${tab} tab`);
    if (tab === 'Active') {
        cy.get(selectors.jobs.activeTab).click();
    } else if (tab === 'Archive') {
        cy.get(selectors.jobs.archiveTab).click();
    }
    cy.wait(1000); // Wait for tab content to load
});

// Open job dropdown menu
Cypress.Commands.add('openJobDropdown', (jobIndex = 0) => {
    cy.log(`Opening job dropdown for job at index ${jobIndex}`);
    cy.get('button:has(svg)').eq(jobIndex + 1).click(); // +1 to skip sidebar buttons
});

// Archive a job
Cypress.Commands.add('archiveJob', (jobIndex = 0) => {
    cy.log(`Archiving job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.contains('Archive', { timeout: 5000 }).click();
    cy.get('.fixed.inset-0', { timeout: 5000 }).should('be.visible');
    cy.get('button:contains("Confirm")').click();
    cy.get('.fixed.inset-0', { timeout: 5000 }).should('not.exist');
    cy.task('logMessage', {
        message: 'Job archived successfully',
        style: 'green',
    });
});

// Reopen/Unarchive a job
Cypress.Commands.add('reopenJob', (jobIndex = 0) => {
    cy.log(`Reopening job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.contains('Active', { timeout: 5000 }).click();
    cy.get('.fixed.inset-0', { timeout: 5000 }).should('be.visible');
    cy.get('button:contains("Confirm")').click();
    cy.get('.fixed.inset-0', { timeout: 5000 }).should('not.exist');
    cy.task('logMessage', {
        message: 'Job reopened successfully',
        style: 'green',
    });
});

// Edit a job
Cypress.Commands.add('editJob', (jobIndex = 0) => {
    cy.log(`Editing job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.contains('Edit Job', { timeout: 5000 }).click();
    cy.url().should('include', '/edit-job');
    cy.task('logMessage', {
        message: 'Navigated to job edit page',
        style: 'green',
    });
});

// Clone/Duplicate a job
Cypress.Commands.add('duplicateJob', (jobIndex = 0) => {
    cy.log(`Duplicating job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.get(selectors.jobs.duplicateJobOption, { timeout: 5000 }).click();
    cy.url().should('include', '/duplicate-job');
    cy.task('logMessage', {
        message: 'Navigated to job duplication page',
        style: 'green',
    });
});

// Delete a job
Cypress.Commands.add('deleteJob', (jobIndex = 0) => {
    cy.log(`Deleting job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.contains('Delete', { timeout: 5000 }).click();
    cy.get(selectors.jobs.confirmDeleteButton, { timeout: 5000 }).click();
    cy.task('logMessage', {
        message: 'Job deleted successfully',
        style: 'green',
    });
});

// Verify job is in active tab
Cypress.Commands.add('verifyJobInActiveTab', (jobTitle) => {
    cy.log(`Verifying job "${jobTitle}" is in active tab`);
    cy.switchJobTab('Active');
    cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
});

// Verify job is in archive tab
Cypress.Commands.add('verifyJobInArchiveTab', (jobTitle) => {
    cy.log(`Verifying job "${jobTitle}" is in archive tab`);
    cy.switchJobTab('Archive');
    cy.contains(jobTitle, { timeout: 10000 }).should('be.visible');
});

// Get job title by index
Cypress.Commands.add('getJobTitleByIndex', (jobIndex = 0) => {
    cy.log(`Getting job title at index ${jobIndex}`);
    return cy.get('h3, h4, .text-lg, .font-medium').eq(jobIndex).invoke('text').then((title) => {
        cy.task('logMessage', {
            message: `Job title: ${title}`,
            style: 'gray',
        });
        return title.trim();
    });
});

// Verify job count
Cypress.Commands.add('verifyJobCount', (expectedCount) => {
    cy.log(`Verifying job count is ${expectedCount}`);
    cy.get(selectors.jobs.jobCard).should('have.length', expectedCount);
});

// Load more jobs
Cypress.Commands.add('loadMoreJobs', () => {
    cy.log('Loading more jobs');
    cy.get(selectors.jobs.loadMoreButton, { timeout: 10000 }).click();
    cy.wait(2000); // Wait for more jobs to load
});

// Verify job status
Cypress.Commands.add('verifyJobStatus', (jobTitle, expectedStatus) => {
    cy.log(`Verifying job "${jobTitle}" has status "${expectedStatus}"`);
    cy.contains(jobTitle).parent().parent().contains(expectedStatus).should('be.visible');
});
