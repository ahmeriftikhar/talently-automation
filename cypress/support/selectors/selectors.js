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
        // HeaderAvatar dropdown (components/HeaderAvatar) — present in the top Header on authed pages.
        // Its trigger button carries aria-label directly (the job-card kebab has it on a <span>, so a
        // button[aria-label] selector uniquely targets the avatar). Workspaces render as menu items
        // listing each workspace name; the current one is disabled.
        switcherTrigger: 'button[aria-label="Customise options"]',
        menuItem: '[role="menuitem"]',
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
    // Dynamic job creation wizard (/dynamic-interview) — a SEPARATE flow from fixed job creation.
    // Steps: Job Details -> Configure Skillset (AI-generated) -> [Coding, if enabled] ->
    // Interview Configuration -> Summary. The footer Proceed/Publish button id
    // (#submit-dynamic-interview) is REUSED on every step, so scope by the active step's heading.
    dynamicJob: {
        // --- Entry: create-job-option-modal chooser card ---
        dynamicQuestionsOption: 'h5:contains("Dynamic questions")',

        // --- Step 1: Job Details (dynamic-interview/job-details.tsx) ---
        // Title placeholder uses curly quotes — match a stable substring only.
        jobTitleInput: 'input[placeholder*="Senior Software Developer"]',
        jobDescriptionEditor: '[contenteditable="true"]', // react-rte editor, NOT a textarea
        jobLocationRemote: '#location_remote',
        jobLocationHybrid: '#location_hybrid',
        jobLocationOnsite: '#location_onsite',
        // Radix Select (common/select/select.tsx): trigger has .select-trigger-btn, options role=option
        jobTypeSelect: 'button.select-trigger-btn:contains("Select Job Type")',
        // Language SelectDropdown defaults to "English"; only touch it if a non-default is needed.
        interviewLanguageSelect: 'button.select-trigger-btn:contains("English")',
        selectOption: '[role="option"]',
        askForResumeCheckbox: '#c1',
        resumeRequired: '#resume_required',
        resumeOptional: '#resume_optional',
        liveCodingCheckbox: '#c2', // only present when NEXT_PUBLIC_CODING_INTERVIEW_ENABLED === 'true'

        // --- Footer (shared on every step) ---
        proceedButton: '#submit-dynamic-interview', // "Proceed" / "Save and Publish"
        saveDraftButton: '#job-save-draft',

        // --- Skill generation (async) + Configure Skillset (configure-skillset.tsx) ---
        generatedSkillsHeading: 'h3:contains("Generated Skill Sets")',
        // Per-skill accordion trigger (Radix, type="single"). No id; every trigger renders
        // "{n} Topic(s) Selected", so match by that text. Has data-state/aria-expanded for open/closed.
        skillAccordionTrigger: 'button:contains("Topics Selected"), button:contains("Topic Selected")',
        // Topic chips share a DUPLICATE id="job-topic-update". Use an ATTRIBUTE selector, NOT '#id':
        // jQuery/Sizzle optimizes '#id' to getElementById() and returns only the FIRST match, so
        // '#job-topic-update' would see just one topic per skill. '[id="..."]' returns them all.
        skillTopicToggle: '[id="job-topic-update"]',
        addSkillTopicButton: '#add-job-skill-topic',     // "+" opens the topic input
        addSkillTopicInput: 'input[placeholder="Enter topic"]',
        confirmSkillTopicButton: '#add-skill-topic',     // checkmark to confirm the topic
        selectTopicError: 'p.text-xs.text-red-500',      // "*Please select at least one topic"

        // --- Basic Instructions (configure-skill-set-form.tsx) — all optional ---
        expectationsTextarea: 'textarea[placeholder*="Effective communicator"]',
        redFlagsTextarea: 'textarea[placeholder*="buzz words"]',
        customInstructionsTextarea: 'textarea[placeholder*="custom instructions"]',

        // --- Customize Questions section (embedded in the skillset step) ---
        addQuestionButton: '#add-interview-question, button:contains("Add another"), button:contains("Add Question")',
        questionInput: 'input[placeholder="Enter question"], textarea[placeholder="Enter question"]',
        deleteQuestionButton: '#delete-single-question',

        // --- Coding step (create-coding-questions.tsx) — conditional ---
        codingHeading: 'h3:contains("Customize Coding Questions")',
        addCodingQuestionButton: '#add-interview-question',

        // --- Interview Configuration (shared with fixed flow) ---
        transcriptionToggle: 'button[role="switch"]',
        basicEngine: '#engine_basic',
        proEngine: '#engine_advance',

        // --- Summary / publish + published modal (on /job-post/[id]) ---
        publishButton: '#submit-dynamic-interview', // labeled "Save and Publish"
        publishedModalTitle: ':contains("Job Published Successfully")',
        copyInterviewLinkButton: '#copy-interview-link',

        // --- Validation (any step) ---
        validationError: '.text-red-500',
    },
    // Applied-candidates page (/applied-candidates) — candidate actions (scores, move stage).
    // Reached from a job card's "View All" on /create-job. Actions require an UNLOCKED, SCORED
    // candidate (a completed interview report); locked/processing rows have a disabled kebab.
    candidateActions: {
        // Entry: job-stat-card "View All" (no id — text only, one per stat tile)
        viewAllButton: 'button:contains("View All")',
        // Top Radix tabs
        candidatesTab: '[role="tab"]:contains("Candidates")',
        jobDetailsTab: '[role="tab"]:contains("Job Details")',
        // Stage chips (the real status filter) — plain buttons by label (Reconsider is not a chip)
        stageChip: (label) => `button:contains("${label}")`,
        // Candidate table
        table: 'table',
        rows: 'table tbody tr',
        headerScore: 'table thead th:contains("Score")',
        headerStage: 'table thead th:contains("Stage")',
        // Score is an inline SVG <text> reading "N%" (or "Processing" spinner when not scored)
        scoreText: 'table tbody tr td svg text',
        // Per-row action kebab (Radix DropdownMenu trigger wraps this span). Disabled if locked.
        actionTrigger: '[aria-label="Customise options"]',
        lockedUpgradeButton: '#upgrade-plan-home',
        // Menu items (portaled to body) — by GA id
        shortlistOption: '#shortlist-candidate',
        rejectOption: '#reject-candidate',
        reconsiderOption: '#reconsider-candidate', // "Move Back to Applied"
        // Status-update modal (reason required; confirm disabled until textarea non-empty)
        reasonTextarea: 'textarea[placeholder="Leave Feedback"]',
        confirmActionButton: '#submit-candidate-rejection-reason',
        cancelActionButton: 'button:contains("Cancel")',
        modalBackdrop: '#backdrop',
        // Success toast after a move
        statusUpdatedToast: ':contains("Interview status updated")',
    },
    candidate: {
        nameInput: '[data-cy="candidate-name-input"], [placeholder="Name"], [placeholder="Enter name"]',
        emailInput: '[data-cy="candidate-email-input"], [placeholder="Email"], [placeholder="Enter email"]',
        countrySelect: '[data-cy="candidate-country-select"], button[role="combobox"]',
        phoneInput: '[data-cy="candidate-phone-input"], [placeholder="Phone number"], [placeholder="Enter phone number"]',
        termsCheckbox: '[data-cy="candidate-terms-checkbox"], [type="checkbox"]',
        proceedButton: '#proceed-interview-click-candidate, button:contains("Proceed")',
        devicesChecked: '#devices_checked',
        joinNowButton: '#join-now-interview',
        startInterviewButton: '#start-interview-click-candidate',
        // Resume upload step (interview/resume-upload-form.tsx) — shown after Proceed only when the
        // job asks for a resume (candidate_resume != null). File input is PDF-only and visually hidden.
        resumeFileInput: '#resume',
        resumeUploadedIndicator: 'button:contains("Upload Latest")', // appears after a successful upload
        resumeProceedButton: '#proceed-resume-upload',
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
    // Mock interview flow (home hero -> /mock-interview/interview). Verified against interview-ai/frontend;
    // notes mark where a legacy selector was stale.
    mock: {
        startPracticingBtn: '#mock-start-practicing', // home "Try AI Interview" / landing "Start Practicing for Free!"
        bookADemoBtn: '#book-demo', // home hero only (opens a calendar; does NOT navigate)
        // Job information stage
        proceedBtn: '#mock-submit-interview', // "Proceed"
        createCustomBtn: '#mock-start-customisation-step2', // "Create my custom interview" (legacy #mock-start-customisation is stale)
        jobTitleInput: 'input[name="job_title"]',
        jobDescriptionEditor: '.public-DraftEditor-content', // react-rte / Draft.js contenteditable (legacy .notranslate was generic)
        selectTrigger: 'button.select-trigger-btn', // Radix Select trigger (roles / duration / language)
        selectOption: '[role="option"]',
        // User information stage
        userNameInput: 'input[name="user_name"]',
        userEmailInput: 'input[name="user_email"]',
        startInterviewStep1Btn: '#mock-start-interview-step1', // "Start interview" (disabled until mic+cam active)
        // In-call
        inCallStartBtn: '#mock-start-interview', // "Start Interview"
        resumeBtn: '#resume-interview', // inactivity modal "Resume Interview"
        errorMsg: 'span.text-xs.text-red-500',
        // Transcript bot bubble (bg-[#5B5048]) — same as the regular interview transcript
        botBubble: '[class*="5B5048"]',
        conversationBox: '.overflow-hidden > .text-xs',
    },
};
