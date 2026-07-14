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
        fixedQuestionsOption: '[data-cy="create-fixed-job"]',
        dynamicQuestionsOption: '[data-cy="create-dynamic-job"]',
        jobTitleInput: '[name="title"]',
        jobDescriptionEditor: '[data-cy="job-description-editor"], .notranslate',
        jobTypeSelect: '[data-cy="job-type-select"], [placeholder="Select Job Type"]',
        interviewDurationSelect: '[data-cy="interview-duration-select"]',
        publishQuestionsButton: '#click-publish-job-questions',
        submitFooterButton: '#submit-dynamic-interview',
        copyInterviewLinkButton: '#copy-interview-link',
        candidateInterviewLink: '[data-cy="candidate-interview-link"]',
        publishedModal: '#backdrop',
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
};
