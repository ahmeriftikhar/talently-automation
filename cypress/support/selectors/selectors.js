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
        addJobButton: 'button:contains("Add Job")',
        fixedQuestionsOption: 'button:contains("Fixed questions")',
        dynamicQuestionsOption: 'button:contains("Dynamic questions")',
        jobTitleInput: 'input[placeholder*="Senior Software Developer"]',
        jobDescriptionEditor: '[contenteditable="true"]',
        jobLocationRemote: '#location_remote',
        jobLocationHybrid: '#location_hybrid',
        jobLocationOnsite: '#location_onsite',
        jobTypeSelect: ':nth-child(4) > :nth-child(3) > .relative, [placeholder="Select Job Type"]',
        selectOption: '[role="option"]',
        interviewDurationSelect: ':nth-child(5) > :nth-child(1) > :nth-child(3) > .relative, [placeholder="Select Interview Duration"]',
        interviewLanguageSelect: ':nth-child(6) > :nth-child(3) > .relative, [placeholder="English"]',
        askForResumeCheckbox: '#c1',
        liveCodingCheckbox: '#c2',
        resumeOptional: '#resume_optional',
        proceedButton: 'button:contains("Proceed"), #submit-dynamic-interview',
        nextButton: 'button:contains("Next")',
        deleteQuestionButton: '#delete-single-question',
        confirmDeleteButton: 'button:contains("Confirm")',
        resumeRequired: '#resume_required',
        addInterviewQuestionButton: 'button:contains("Add another"), #add-interview-question',
        questionEditor: '.pt-6 > .px-5',
        codingQuestionEditor: '.rounded-lg > .px-6',
        transcriptionToggle: '.w-\\[75px\\] > .w-9',
        basicEngine: '#engine_basic',
        proEngine: '#engine_advance',
        publishButton: 'button:contains("Save and Publish")',
        copyInterviewLinkButton: 'button:contains("Copy")',
        candidateInterviewLink: '[data-cy="candidate-interview-link"]',
        publishedModal: '.fixed.inset-0',
        jobCreationTab: 'button:contains("Job Creation")',
        customizeQuestionsTab: 'button:contains("Customize Interview Questions")',
        interviewConfigTab: 'button:contains("Interview Configuration")',
        summaryTab: 'button:contains("Summary and Review")',
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
        continueButton: 'button:contains("Continue")',
        terminationBox: '.fixed.inset-0',
        terminationTimer: '.text-\\[18px\\]',
        screenShareModal: '.modal-content',
        counterDisplay: '.text-\\[48px\\]',
        feedbackScreen: '.feedback-container',
        completedMessage: 'Interview is completed',
        readyMessage: 'Are you ready to begin?',
    },
};
