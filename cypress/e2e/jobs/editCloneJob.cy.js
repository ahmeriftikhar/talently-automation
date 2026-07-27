import { selectors } from '../../support/selectors/selectors';

/**
 * Job Edit & Clone verification.
 *
 * These tests verify that the edit-job and duplicate-job (clone) FORMS open correctly and are
 * pre-populated from the source job. Both pages reuse the same wizard (AddJobStepOne), and
 * initialise react-hook-form with `defaultValues` from the fetched job, so the job title input
 * is pre-filled from the source job in both flows.
 *
 * NOTE: they intentionally do NOT save/publish. Saving an edit would mutate a real job and
 * publishing a clone would create a real job in the workspace (irreversible, like the skipped
 * delete test). Enable an end-to-end save/publish only against a dedicated throwaway job.
 */
describe('Job Edit & Clone Tests', () => {
    Cypress.on('uncaught:exception', () => false);

    beforeEach(() => {
        cy.loginAsAutomationCompany();
        cy.navigateToJobListing();
    });

    it('should open the edit-job form pre-populated with the existing job data', () => {
        cy.task('logMessage', {
            message: 'Test Case: Edit-job form opens pre-populated with the job data',
            style: 'blue',
        });

        cy.getJobTitleByIndex(0).then((jobTitle) => {
            // Open Edit Job from the card kebab (command asserts the /edit-job URL)
            cy.editJob(0);

            // The job-details form should load with the title pre-filled from the source job
            cy.get(selectors.jobs.jobTitleInput, { timeout: 15000 })
                .should('be.visible')
                .and('have.value', jobTitle);

            // Wizard tabs should be present (edit page uses the "Job Details" tab)
            cy.get(selectors.jobs.jobDetailsTab).should('be.visible');
        });

        cy.task('logMessage', {
            message: 'Edit-job form pre-populated correctly',
            style: 'green',
        });
    });

    it('should allow editing a field on the edit-job form (not saved)', () => {
        cy.task('logMessage', {
            message: 'Test Case: Edit a field on the edit-job form',
            style: 'blue',
        });

        cy.editJob(0);

        // Change the title locally and confirm the field reflects the new value.
        // Deliberately NOT saved — avoids mutating the real job.
        const updatedTitle = `Edited Automation Job ${Date.now()}`;
        cy.get(selectors.jobs.jobTitleInput, { timeout: 15000 })
            .should('be.visible')
            .clear()
            .type(updatedTitle)
            .should('have.value', updatedTitle);

        cy.task('logMessage', {
            message: 'Edit-job field is editable',
            style: 'green',
        });
    });

    it('should open the duplicate-job (clone) form pre-populated from the source job', () => {
        cy.task('logMessage', {
            message: 'Test Case: Clone form opens pre-populated from the source job',
            style: 'blue',
        });

        cy.getJobTitleByIndex(0).then((jobTitle) => {
            // Open Clone Job from the card kebab (command asserts the /duplicate-job URL)
            cy.duplicateJob(0);

            // Cloning copies the source job's data — the title input should match the source
            cy.get(selectors.jobs.jobTitleInput, { timeout: 15000 })
                .should('be.visible')
                .and('have.value', jobTitle);
        });

        cy.task('logMessage', {
            message: 'Clone form pre-populated from source job correctly',
            style: 'green',
        });
    });

    it('should show the job-creation wizard tabs on the clone form', () => {
        cy.task('logMessage', {
            message: 'Test Case: Clone form shows the wizard tabs',
            style: 'blue',
        });

        cy.duplicateJob(0);

        cy.get(selectors.jobs.jobDetailsTab, { timeout: 15000 }).should('be.visible');
        cy.get(selectors.jobs.summaryTab).should('be.visible');

        cy.task('logMessage', {
            message: 'Clone form wizard tabs displayed',
            style: 'green',
        });
    });

    /**
     * Complete edit-job flow, ending in a successful save (publish).
     *
     * WARNING: this MUTATES a real job — it edits the title (persisted via PATCH /job/:id on each
     * "Proceed") and re-publishes the job (POST /job/:id/publish) at the end. Every step advances
     * with the shared "#submit-dynamic-interview" footer button. The coding-questions step only
     * exists when the job has coding enabled, so it is handled conditionally.
     */
    it('should complete the full edit-job flow and save (publish) successfully', () => {
        cy.task('logMessage', {
            message: 'Test Case: Complete edit-job flow and save successfully',
            style: 'blue',
        });

        const backendBaseUrl = Cypress.env('backendBaseUrl');
        cy.intercept('PATCH', `${backendBaseUrl}/job/*`).as('updateJob');
        cy.intercept('POST', `${backendBaseUrl}/job/*/publish`).as('publishJob');

        // Open the edit form for the first job
        cy.editJob(0);

        // --- Step 1: Job Details — edit the title, then Proceed (persists via PATCH) ---
        cy.get(selectors.jobs.jobTitleInput, { timeout: 15000 }).should('be.visible');
        cy.get(selectors.jobs.jobTitleInput).invoke('val').then((currentTitle) => {
            // Keep the base title stable across runs; just ensure an " (edited)" suffix is present.
            const base = String(currentTitle).replace(/\s*\(edited\)\s*$/i, '').trim();
            const editedTitle = `${base} (edited)`;

            cy.get(selectors.jobs.jobTitleInput).clear().type(editedTitle).should('have.value', editedTitle);
            cy.get(selectors.jobs.proceedButton).filter(':visible').first().click();

            // The edit is saved here — assert the update API succeeded
            cy.wait('@updateJob', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
        });

        // --- Step 2: Customize Questions — advance (existing job already has questions) ---
        cy.get(selectors.jobs.customizeQuestionsTabEdit, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // The next tab is Coding (only if the job has coding) OR Interview Configuration.
        // Wait (with retry) until one of them is actually active before branching — avoids racing
        // the tab transition.
        const codingActiveSel = `${selectors.jobs.codingQuestionsTab}[data-state="active"]`;
        const configActiveSel = `${selectors.jobs.interviewConfigTab}[data-state="active"]`;
        cy.get('body', { timeout: 30000 }).should(($body) => {
            const reached = $body.find(codingActiveSel).length + $body.find(configActiveSel).length;
            expect(reached, 'reached coding or interview-configuration tab').to.be.greaterThan(0);
        });

        // --- Step 3 (conditional): Customize Coding Questions — advance if it's the active tab ---
        cy.get('body').then(($body) => {
            if ($body.find(codingActiveSel).length > 0) {
                cy.task('logMessage', { message: 'Coding step present — advancing', style: 'gray' });
                cy.get(selectors.jobs.proceedButton).filter(':visible').first().click();
            }
        });

        // --- Step 4: Interview Configuration — advance ---
        cy.get(selectors.jobs.interviewConfigTab, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // --- Step 5: Summary and Review — Save and Publish ---
        cy.get(selectors.jobs.summaryTab, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // The job is saved/published at the end of the flow — assert the publish API succeeded
        cy.wait('@publishJob', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);

        cy.task('logMessage', {
            message: 'Edit-job flow completed and job saved (published) successfully',
            style: 'green',
        });
    });

    /**
     * Complete clone (duplicate) job flow, ending in a successful save (publish).
     *
     * WARNING: cloning CREATES A NEW real job. Step 1 "Proceed" creates it (POST /create-job),
     * later steps update it (PATCH /job/:id), and Summary publishes it (POST /job/:id/publish),
     * so a new published job is added to the workspace on every run. Every step advances with the
     * shared "#submit-dynamic-interview" footer; the coding step is handled conditionally.
     */
    it('should complete the full clone-job flow and save (publish) successfully', () => {
        cy.task('logMessage', {
            message: 'Test Case: Complete clone-job flow and save successfully',
            style: 'blue',
        });

        const backendBaseUrl = Cypress.env('backendBaseUrl');
        cy.intercept('POST', `${backendBaseUrl}/create-job`).as('createJob');
        cy.intercept('POST', `${backendBaseUrl}/job/*/publish`).as('publishJob');

        // Open the clone form for the first job (pre-populated from the source job)
        cy.duplicateJob(0);

        // --- Step 1: Job Details — give the clone a distinct title, then Proceed (creates the job) ---
        cy.get(selectors.jobs.jobTitleInput, { timeout: 15000 }).should('be.visible');
        cy.get(selectors.jobs.jobTitleInput).invoke('val').then((currentTitle) => {
            const base = String(currentTitle).replace(/\s*\(clone\)\s*$/i, '').trim();
            const cloneTitle = `${base} (clone)`;

            cy.get(selectors.jobs.jobTitleInput).clear().type(cloneTitle).should('have.value', cloneTitle);
            cy.get(selectors.jobs.proceedButton).filter(':visible').first().click();

            // Cloning creates a NEW job here — assert the create API succeeded
            cy.wait('@createJob', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
        });

        // --- Step 2: Customize Questions — advance (cloned questions are pre-filled) ---
        cy.get(selectors.jobs.customizeQuestionsTabEdit, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // The next tab is Coding (only if the job has coding) OR Interview Configuration.
        // Wait (with retry) until one of them is active before branching.
        const codingActiveSel = `${selectors.jobs.codingQuestionsTab}[data-state="active"]`;
        const configActiveSel = `${selectors.jobs.interviewConfigTab}[data-state="active"]`;
        cy.get('body', { timeout: 30000 }).should(($body) => {
            const reached = $body.find(codingActiveSel).length + $body.find(configActiveSel).length;
            expect(reached, 'reached coding or interview-configuration tab').to.be.greaterThan(0);
        });

        // --- Step 3 (conditional): Customize Coding Questions — advance if it's the active tab ---
        cy.get('body').then(($body) => {
            if ($body.find(codingActiveSel).length > 0) {
                cy.task('logMessage', { message: 'Coding step present — advancing', style: 'gray' });
                cy.get(selectors.jobs.proceedButton).filter(':visible').first().click();
            }
        });

        // --- Step 4: Interview Configuration — advance ---
        cy.get(selectors.jobs.interviewConfigTab, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // --- Step 5: Summary and Review — Save and Publish ---
        cy.get(selectors.jobs.summaryTab, { timeout: 30000 })
            .should('have.attr', 'data-state', 'active');
        cy.get(selectors.jobs.proceedButton, { timeout: 20000 }).filter(':visible').first().click();

        // The cloned job is saved/published at the end of the flow — assert the publish API succeeded
        cy.wait('@publishJob', { timeout: 60000 }).its('response.statusCode').should('be.oneOf', [200, 201]);

        cy.task('logMessage', {
            message: 'Clone-job flow completed and job saved (published) successfully',
            style: 'green',
        });
    });
});
