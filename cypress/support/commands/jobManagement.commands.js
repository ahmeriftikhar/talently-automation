import { selectors } from '../selectors/selectors';

const backendUrl = () => Cypress.env('backendBaseUrl') || Cypress.config('baseSecUrl');

// Navigate to job listing page
Cypress.Commands.add('navigateToJobListing', () => {
    cy.log('Navigating to job listing page');
    cy.visit(selectors.jobs.jobListingPage);
    cy.url().should('include', '/create-job');
    cy.get(selectors.jobs.activeTab, { timeout: 10000 }).should('be.visible');
    // First redirect to /create-job is slow: the tab renders before the jobs fetch resolves.
    // Wait (generously) for the Active count to populate (> 0) and the cards to actually render,
    // so downstream commands don't race an empty list. Assertions retry until the fetch settles.
    cy.get(selectors.jobs.activeTab, { timeout: 30000 })
        .should(($t) => expect(parseInt($t.text().replace(/\D/g, ''), 10)).to.be.greaterThan(0));
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', 0);
});

// Search for a job
Cypress.Commands.add('searchJob', (searchTerm) => {
    cy.log(`Searching for job: ${searchTerm}`);
    // Assert the value landed (dynamic) instead of a fixed wait; callers assert on results with retry.
    cy.get(selectors.jobs.searchInput, { timeout: 10000 }).clear().type(searchTerm).should('have.value', searchTerm);
});

// Switch between Active and Archive tabs
Cypress.Commands.add('switchJobTab', (tab) => {
    cy.log(`Switching to ${tab} tab`);
    const tabSelector = tab === 'Active' ? selectors.jobs.activeTab : selectors.jobs.archiveTab;
    cy.get(tabSelector).click();
    // Wait for the Radix tab to actually become active instead of a fixed delay.
    cy.get(tabSelector).should('have.attr', 'data-state', 'active');
});

// Open job dropdown menu (Radix DropdownMenu kebab per card)
Cypress.Commands.add('openJobDropdown', (jobIndex = 0) => {
    cy.log(`Opening job dropdown for job at index ${jobIndex}`);
    cy.get(selectors.jobs.jobDropdownTrigger, { timeout: 10000 }).eq(jobIndex).click();
});

// Archive a job
Cypress.Commands.add('archiveJob', (jobIndex = 0) => {
    cy.log(`Archiving job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.get(selectors.jobs.archiveOption, { timeout: 5000 }).click();
    cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('be.visible');
    cy.get(selectors.jobs.switchStatusConfirmButton).click();
    cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('not.exist');
    cy.task('logMessage', {
        message: 'Job archived successfully',
        style: 'green',
    });
});

// Reopen/Unarchive a job
Cypress.Commands.add('reopenJob', (jobIndex = 0) => {
    cy.log(`Reopening job at index ${jobIndex}`);

    // Wait for the (archive) list to render before interacting — opening the kebab during the
    // tab-transition (while the archive GET is still in flight) can open the menu on a stale
    // Active-tab card, or the menu closes when the archive list re-renders on fetch. The reopen
    // item ("Active Job") is present but `hidden` for non-archived cards, so we retry opening the
    // kebab until the VISIBLE reopen option appears on an actually-archived card.
    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', jobIndex);
    cy.get(selectors.jobs.jobDropdownTrigger, { timeout: 15000 }).should('have.length.greaterThan', jobIndex);

    const openAndClickReopen = (attempt = 0) => {
        cy.openJobDropdown(jobIndex);
        cy.get('body').then(($b) => {
            const $opt = $b.find(selectors.jobs.activeOption).filter(':visible');
            if ($opt.length) {
                cy.wrap($opt.first()).click();
            } else if (attempt < 3) {
                cy.log(`Reopen option not visible yet — retrying (attempt ${attempt + 1})`);
                cy.get('body').type('{esc}'); // close the menu and retry after the list settles
                cy.get(selectors.jobs.jobCard, { timeout: 15000 }).should('have.length.greaterThan', jobIndex);
                openAndClickReopen(attempt + 1);
            } else {
                throw new Error('Reopen ("Active Job") option not available on the archived job dropdown');
            }
        });
    };
    openAndClickReopen();

    cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('be.visible');
    cy.get(selectors.jobs.switchStatusConfirmButton).click();
    cy.get(selectors.jobs.switchStatusModal, { timeout: 5000 }).should('not.exist');
    cy.task('logMessage', {
        message: 'Job reopened successfully',
        style: 'green',
    });
});

// Yield the index of the first job card of type "Fixed" (standard wizard), or -1 if none.
// Each card renders a "Fixed" / "Dynamic" type badge (job-detail-card.tsx). The edit/clone specs
// need a Fixed job because a Dynamic job routes to /edit-dynamic-interview and uses a different
// wizard (no Customize Questions / Coding / Interview Config tabs).
Cypress.Commands.add('firstFixedJobIndex', () => {
    return cy.get(selectors.jobs.jobCard).then(($cards) => {
        let idx = -1;
        $cards.each((i, el) => {
            if (idx >= 0) return;
            const isFixed = [...Cypress.$(el).find('div')].some(
                (d) => Cypress.$(d).text().trim() === 'Fixed'
            );
            if (isFixed) idx = i;
        });
        return idx;
    });
});

// Yield the index of the first FIXED job, paging through "Load More Jobs" if the current page has
// none. Keeps loading more and re-scanning until a Fixed job is found or there are no more pages
// (yields -1 in that case).
Cypress.Commands.add('firstFixedJobIndexAcrossPages', () => {
    const scan = () =>
        cy.firstFixedJobIndex().then((idx) => {
            if (idx >= 0) return idx;
            return cy.get('body').then(($b) => {
                const hasMore = $b.find(selectors.jobs.loadMoreButton).length > 0;
                if (!hasMore) return -1;
                return cy.get(selectors.jobs.jobCard).its('length').then((before) => {
                    cy.task('logMessage', { message: 'No Fixed job on this page — clicking "Load More Jobs"', style: 'gray' });
                    cy.get(selectors.jobs.loadMoreButton).scrollIntoView().click();
                    cy.get(selectors.jobs.jobCard, { timeout: 30000 }).should('have.length.greaterThan', before);
                    return scan();
                });
            });
        });
    return scan();
});

// Edit a job
Cypress.Commands.add('editJob', (jobIndex = 0) => {
    cy.log(`Editing job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.get(selectors.jobs.editJobOption, { timeout: 5000 }).click();
    cy.url().should('include', '/edit-job');
    cy.task('logMessage', {
        message: 'Navigated to job edit page',
        style: 'green',
    });
});

// Clone/Duplicate a job ("Clone Job" menu item)
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

// Delete a job (admin/owner only). The confirm modal (ConfirmActionList) REQUIRES typing the
// job title before the delete is enabled — caller must pass the exact title.
Cypress.Commands.add('deleteJob', (jobIndex = 0, jobTitle) => {
    cy.log(`Deleting job at index ${jobIndex}`);
    cy.openJobDropdown(jobIndex);
    cy.get(selectors.jobs.deleteJobOption, { timeout: 5000 }).click();
    cy.get(selectors.jobs.deleteConfirmModalTitle, { timeout: 5000 }).should('be.visible');
    if (jobTitle) {
        // Type the exact job title into the confirmation input to enable the delete action
        cy.get(selectors.jobs.deleteConfirmInput).clear().type(jobTitle).should('have.value', jobTitle);
    }
    cy.get(selectors.jobs.deleteConfirmButton, { timeout: 5000 }).click();
    cy.task('logMessage', {
        message: 'Job delete confirmed',
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

// Get job title by index (reads the card's <h5> title; strips any "[Draft]" prefix).
// NOTE: the callback returns a plain string and queues NO cy commands — do not add cy.* here,
// or Cypress throws "mixing up async and sync code".
Cypress.Commands.add('getJobTitleByIndex', (jobIndex = 0) => {
    cy.log(`Getting job title at index ${jobIndex}`);
    return cy.get(selectors.jobs.jobTitle, { timeout: 10000 })
        .eq(jobIndex)
        .invoke('text')
        .then((title) => title.replace('[Draft]', '').trim());
});

// Verify job count
Cypress.Commands.add('verifyJobCount', (expectedCount) => {
    cy.log(`Verifying job count is ${expectedCount}`);
    cy.get(selectors.jobs.jobCard).should('have.length', expectedCount);
});

// Load more jobs (no fixed wait — the caller asserts the card count increased, which retries)
Cypress.Commands.add('loadMoreJobs', () => {
    cy.log('Loading more jobs');
    cy.get(selectors.jobs.loadMoreButton, { timeout: 10000 }).click();
});

// Verify job status
Cypress.Commands.add('verifyJobStatus', (jobTitle, expectedStatus) => {
    cy.log(`Verifying job "${jobTitle}" has status "${expectedStatus}"`);
    cy.contains(jobTitle).parent().parent().contains(expectedStatus).should('be.visible');
});
