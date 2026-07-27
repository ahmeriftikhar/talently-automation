export const selectors = {
    auth: {
        emailInput: '[name="email"]',
        passwordInput: '[name="password"]',
        loginButton: '#click-login',
        toastMessage: '[data-cy="toast-message"], .Toastify__toast-body, .text-sm > :nth-child(2)',
    },
    cookies: {
        acceptAllButton: 'button:contains("Accept All")',
        declineButton: 'button:contains("Decline Non-Essential")',
        preferenceCenterButton: 'button:contains("Preference Center")',
    },
    sidebar: {
        // Icon-based navigation buttons with tooltips
        dashboardButton: 'button:has(svg):first', // HomeIcon - Dashboard
        jobsButton: 'button:contains("Jobs"), button:has(svg):nth-of-type(2)', // BagIcon - Jobs
        billingButton: 'button:contains("Billing"), button:has(svg):nth-of-type(3)', // MoneyAddIcon - Billing
        exploreButton: 'button:contains("Explore"), button:has(svg):nth-of-type(4)', // DiscoverIcon - Explore
        talentPoolButton: 'button:contains("Talent Pool"), button:has(svg):nth-of-type(5)', // PeopleGroupIcon - Talent Pool (conditional)
        dataButton: 'button:contains("Data"), button:has(svg):nth-of-type(6)', // DataIcon - Data
        integrationButton: 'button:contains("Integration"), button:has(svg):nth-of-type(7)', // IntegrationIcon - Integration
        settingsButton: 'button:contains("Settings"), button:has(svg):nth-of-type(8)', // SettingsLightIcon - Settings
        logoutButton: 'button:contains("Logout"), button:has(svg):nth-of-type(9)', // LogoutAltIcon - Logout
    },
    dashboard: {
        addJobButton: 'button:contains("Add Job")',
        workspaceName: 'h1.text-xl, h1.text-2xl',
        workspaceAvatar: '.rounded-full',
        statCards: '.bg-white.rounded-lg',
    },
    workspace: {
        switcher: '[data-cy="workspace-switcher"]',
        option: (name) => `[data-cy="workspace-option-${name}"]`,
    },
    jobs: {
        // --- Add-job entry (create-job-listing/job-listing-header.tsx) ---
        addJobButton: '#click-add-job',
        // Create-a-New-Job chooser modal cards (dynamic-interview/create-job-option-modal.tsx) — select by text
        fixedQuestionsOption: ':contains("Fixed questions")',
        dynamicQuestionsOption: ':contains("Dynamic questions")',

        // --- Step 1: job details form (add-job/add-job-step-one.tsx) ---
        jobTitleInput: 'input[name="title"]',
        jobDescriptionEditor: '[contenteditable="true"]', // TextEditor, placeholder "Enter description"
        jobLocationRemote: '#location_remote',
        jobLocationHybrid: '#location_hybrid',
        jobLocationOnsite: '#location_onsite',
        // Radix selects (common/select/select.tsx): trigger has class .select-trigger-btn and shows
        // the placeholder text until a value is picked; options render as [role="option"] in a portal.
        jobTypeSelect: 'button.select-trigger-btn:contains("Select Job Type")',
        interviewDurationSelect: 'button.select-trigger-btn:contains("Select Interview Duration")',
        interviewLanguageSelect: 'button.select-trigger-btn:contains("English")',
        selectOption: '[role="option"]',
        askForResumeCheckbox: '#c1',
        resumeRequired: '#resume_required',
        resumeOptional: '#resume_optional',
        liveCodingCheckbox: '#c2', // add-job/components/coding-checkbox.tsx

        // --- Footer (dynamic-interview/dynamic-interview-footer.tsx), reused on every step ---
        proceedButton: '#submit-dynamic-interview', // btnLabel "Proceed" on steps
        saveDraftButton: '#job-save-draft',
        nextButton: '#submit-dynamic-interview',

        // --- Step 2: interview questions (add-job/components/*) ---
        addInterviewQuestionButton: '#add-interview-question',
        editCustomQuestionButton: '#edit-single-custom-question',
        deleteQuestionButton: '#delete-single-question',
        questionEditor: 'textarea[placeholder]', // single-question.tsx textarea (placeholder i18n custom_question)
        // NOTE: confirm modal for deleting a question not yet verified against source — verify live.
        confirmDeleteButton: 'button:contains("Confirm")',

        // --- Coding questions step ---
        addCodingQuestionButton: '#add-coding-question',
        codingQuestionEditor: '.rounded-lg > .px-6', // TODO: positional, verify against interview-coding-questions.tsx

        // --- Interview configuration step (add-job/components/transcription-toggle.tsx) ---
        transcriptionToggle: 'button[role="switch"]', // Radix Switch, exposes aria-checked
        // NOTE: engine radios #engine_basic/#engine_advance not confirmed present in current source — verify live.
        basicEngine: '#engine_basic',
        proEngine: '#engine_advance',

        // --- Summary / publish (add-job/fixed-summary-review.tsx) ---
        publishButton: '#submit-dynamic-interview', // btnLabel "Save and Publish"
        copyInterviewLinkButton: '#copy-interview-link',

        // --- Wizard tab triggers — Radix tabs, match by text ---
        // NOTE: the add-job (creation) page uses "Job Creation"/"Customize Interview Questions";
        // the edit-job & duplicate-job pages use "Job Details"/"Customize Questions".
        jobCreationTab: '[role="tab"]:contains("Job Creation")',        // add-job page
        jobDetailsTab: '[role="tab"]:contains("Job Details")',          // edit-job / duplicate-job page
        customizeQuestionsTab: '[role="tab"]:contains("Customize Interview Questions")',
        customizeQuestionsTabEdit: '[role="tab"]:contains("Customize Questions")', // edit/duplicate page
        codingQuestionsTab: '[role="tab"]:contains("Customize Coding Questions")',
        interviewConfigTab: '[role="tab"]:contains("Interview Configuration")',
        summaryTab: '[role="tab"]:contains("Summary and Review")',

        // --- Job listing page (create-job-listing/*) ---
        jobListingPage: '/create-job',
        // Global top-bar search (create-job-listing/job-search-bar.tsx) — there is NO search box inside the list body
        searchInput: 'input[placeholder*="Search jobs"]',
        // Active/Archive are Radix Tabs.Trigger => role=tab; text is "Active Jobs"/"Archived Jobs"
        activeTab: '[role="tab"]:contains("Active Jobs")',
        archiveTab: '[role="tab"]:contains("Archived Jobs")',
        jobCard: 'div.bg-white.border.rounded-lg',
        loadMoreButton: 'button:contains("Load More Jobs")',
        jobTitle: 'div.bg-white.border.rounded-lg h5', // card title <h5> (job-detail-card.tsx)

        // --- Per-card kebab menu (job-detail-card.tsx) — Radix DropdownMenu ---
        // Click the wrapping trigger <button>, not the inner <span aria-label> (Radix won't open otherwise).
        jobDropdownTrigger: 'button:has([aria-label="Customise options"])',
        jobDropdownOption: (label) => `[role="menuitem"]:contains("${label}")`,
        previewJobOption: '[role="menuitem"]:contains("Preview Job post")',
        editJobOption: '[role="menuitem"]:contains("Edit Job")',
        activeOption: '[role="menuitem"]:contains("Active Job")',      // reopen (visible only when archived)
        archiveOption: '[role="menuitem"]:contains("Archive Job")',    // (visible only when active)
        duplicateJobOption: '[role="menuitem"]:contains("Clone Job")', // "Clone Job" == duplicate
        whitelistOption: '[role="menuitem"]:contains("Whitelist Candidates")',
        deleteJobOption: '[role="menuitem"]:contains("Delete Job")',   // admin/owner only

        // --- Archive/Reopen confirm modal (listed-job/switch-job-status-modal.tsx) — Radix Dialog ---
        // Buttons are <p> elements reading "Yes"/"No" (NOT button:contains Confirm/Cancel).
        switchStatusModal: '[role="dialog"]',
        switchStatusOverlay: '.fixed.inset-0',
        switchStatusConfirmButton: '#switch-job-status',            // the "Yes" control
        switchStatusCancelButton: '[role="dialog"] p:contains("No")',
        archiveModal: '[role="dialog"]',
        archiveModalTitle: '[role="dialog"]:contains("close this job position")',
        archiveModalConfirmButton: '#switch-job-status',
        archiveModalCancelButton: '[role="dialog"] p:contains("No")',
        reopenModalTitle: '[role="dialog"]:contains("reopen this job position")',
        // Delete uses common/comfirm-action-list — a plain .fixed.inset-0 overlay (NOT a Radix dialog).
        // Title is an <h4>, and it REQUIRES typing the exact job title into a confirm input.
        deleteConfirmModalTitle: 'h4:contains("Are You Sure to Delete")',
        deleteConfirmInput: '.fixed.inset-0 input[type="text"]',
        deleteConfirmButton: '.fixed.inset-0 button:contains("Confirm")',
    },
    candidate: {
        nameInput: '[data-cy="candidate-name-input"], [placeholder="Name"]',
        emailInput: '[data-cy="candidate-email-input"], [placeholder="Email"]',
        countrySelect: '[data-cy="candidate-country-select"], button[role="combobox"]',
        phoneInput: '[data-cy="candidate-phone-input"], [placeholder="Phone number"]',
        termsCheckbox: '[data-cy="candidate-terms-checkbox"], [type="checkbox"]',
        proceedButton: '#proceed-interview-click-candidate',
        devicesChecked: '#devices_checked',
        joinNowButton: '#join-now-interview',
        startInterviewButton: '#start-interview-click-candidate',
    },
    interview: {
        conversationBox: '.overflow-hidden > .text-xs',
        inactivityModal: '.modal-dialog',
        resumeButton: 'button:contains("Resume Interview")',
        stopButton: '#stop-interview',
        continueButton: 'button:contains("Continue")',
        terminationBox: '.fixed.inset-0',
        terminationTimer: '.text-\\[18px\\]',
        screenShareModal: '.modal-content',
        counterDisplay: '.text-\\[48px\\]',
        feedbackScreen: '.feedback-container',
        completedMessage: 'Interview is completed',
        readyMessage: 'Are you ready to begin?',
        botPanel: 'p:contains("Talently").parent().parent().border-4.border-\\[\\#00BBF9\\]', // Bot panel with speaking indicator
    },
};
