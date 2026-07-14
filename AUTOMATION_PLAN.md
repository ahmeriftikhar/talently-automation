# Interview-AI Automation Plan

## Overview
This document outlines the comprehensive automation plan for the Interview-AI project using Cypress E2E testing. The automation will cover critical user flows, API endpoints, and integration testing to ensure the reliability of the interview platform.

## Current State Analysis

### Interview-AI Project Structure
- **Frontend**: Next.js with React, TypeScript, TailwindCSS
- **Backend**: FastAPI Python with MongoDB, Firebase, Twilio integration
- **Key Features**: Regular interviews, Mock interviews, Coding interviews, Job management
- **Authentication**: Firebase-based with company/admin roles

### Talently-Automation Current State
- Basic Cypress setup with package.json
- Missing Cypress configuration and test structure
- Ready for E2E test implementation

### Legacy Test-Automation-Talently Repository
The old automation repository contains valuable components that can be reused:

**Reusable Libraries:**
- `@faker-js/faker` - Test data generation
- `cypress-real-events` - Realistic user interactions
- `cypress-browser-permissions` - Camera/microphone permission handling
- `socket.io-client` - WebSocket testing for real-time features
- `npm-run-all` - Parallel test execution

**Reusable Patterns:**
- Environment-based configuration (dev/staging/prod)
- Modular command organization by feature
- Centralized selector management
- API intercept handling and waiting
- Session storage management
- Cookie consent handling
- Inactivity modal handling
- Custom logging with colored console output
- Dynamic JSON file creation for test artifacts

**Test Organization:**
- Categorized test suites (smoke, regression, nightly)
- Feature-based spec organization
- Environment-specific test accounts
- Parallel execution setup

## Automation Phases

### Phase 1: Foundation Setup

#### 1.1 Cypress Configuration
- Create `cypress.config.js` with proper settings:
  - baseUrl configuration (http://localhost:3000)
  - baseSecUrl for backend API
  - Viewport settings (1280x720)
  - Default command timeout (60s - increased from legacy project)
  - Request timeout (10s)
  - Video recording on failure
  - Screenshot capture on failure
  - Custom screenshot folder for failed cases
- Configure environment variables:
  - Development environment
  - Staging environment
  - Production environment
  - Environment-specific URLs and credentials
- Browser configurations:
  - Chrome (primary)
  - Firefox
  - Edge
- Browser permissions setup:
  - Camera/microphone permissions for interviews
  - Use fake UI for media stream in testing
  - Notifications, geolocation, and other permissions
- Setup test isolation and database cleanup
- Custom task for colored console logging

#### 1.2 Project Structure
```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── login.cy.js
│   │   ├── logout.cy.js
│   │   └── role-based-access.cy.js
│   ├── interviews/
│   │   ├── regular-interview.cy.js
│   │   ├── interview-status.cy.js
│   │   └── interview-completion.cy.js
│   ├── mock-interviews/
│   │   ├── job-creation.cy.js
│   │   ├── user-information.cy.js
│   │   ├── mock-interview-flow.cy.js
│   │   └── report-generation.cy.js
│   ├── coding-interviews/
│   │   ├── coding-questions.cy.js
│   │   ├── code-editor.cy.js
│   │   └── code-evaluation.cy.js
│   ├── jobs/
│   │   ├── create-job.cy.js
│   │   ├── edit-job.cy.js
│   │   ├── archive-job.cy.js
│   │   └── duplicate-job.cy.js
│   ├── candidates/
│   │   ├── view-candidates.cy.js
│   │   ├── filter-candidates.cy.js
│   │   └── candidate-profile.cy.js
│   ├── dashboard/
│   │   ├── statistics.cy.js
│   │   ├── job-listings.cy.js
│   │   └── activity-logs.cy.js
│   └── api/
│       ├── auth-api.cy.js
│       ├── interview-api.cy.js
│       ├── job-api.cy.js
│       └── candidate-api.cy.js
├── support/
│   ├── commands.js (main commands file)
│   ├── e2e.js (support file imports)
│   ├── commands/
│   │   ├── auth.commands.js
│   │   ├── job.commands.js
│   │   ├── candidate.commands.js
│   │   ├── workspace.commands.js
│   │   └── env.commands.js
│   ├── authCommands/
│   │   └── companyAuthCommands.js
│   ├── createJobCommands/
│   │   ├── createJobWithoutCustomizedQsCommands.js
│   │   └── createJobWithCustomizedQsCommands.js
│   ├── interviewCommands/
│   │   ├── interviewCommands.js
│   │   └── dynamicInterviewCommands.js
│   ├── mockInterviewCommands/
│   │   └── mockInterviewCommands.js
│   ├── paymentCommands/
│   │   └── paymentCommands.js
│   ├── selectors/
│   │   └── selectors.js (centralized selectors)
│   └── registerCommands/
│       └── registerCommands.js
├── fixtures/
│   ├── companyUsers.json (test accounts)
│   ├── userAccounts.json
│   ├── jobs.json
│   ├── interviews.json
│   ├── candidates.json
│   └── interviewReports/ (dynamic report artifacts)
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── InterviewPage.js
│   ├── MockInterviewPage.js
│   └── JobPage.js
├── plugins/
│   └── index.js
├── failedCasesEvidence/ (screenshots on failure)
├── reports/ (test reports)
└── videos/ (test recordings)
```

### Phase 2: Test Data Management

#### 2.1 Fixtures Creation
**User Accounts (fixtures/users.json):**
- Admin user with full permissions
- Company user with workspace access
- Candidate user for interviews
- Test users for different scenarios

**Job Descriptions (fixtures/jobs.json):**
- Technical jobs (Frontend, Backend, Full Stack)
- Non-technical jobs (Product Manager, Designer)
- Jobs with coding questions
- Jobs without coding questions
- Archived jobs
- Mock interview jobs

**Interview Scenarios (fixtures/interviews.json):**
- Technical interview scenarios
- Behavioral interview scenarios
- Coding interview scenarios
- Mock interview scenarios
- Different interview durations

**Candidate Data (fixtures/candidates.json):**
- Candidate profiles
- Resume data
- Interview history
- Skill sets

#### 2.2 Environment Configuration
**.env files:**
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

**Configuration includes:**
- API endpoints
- Firebase configuration
- Database connection strings
- Test credentials
- External service URLs (Twilio, OpenAI, etc.)

#### 2.3 Test Database Setup
- Separate test database instance
- Database seeding scripts
- Cleanup procedures between tests
- Data isolation strategies

### Phase 3: Custom Commands

#### 3.1 Authentication Commands
```javascript
cy.loginAsAdmin(credentials)
cy.loginAsCompany(credentials)
cy.loginAsCandidate(credentials)
cy.login(email, password) // Basic login from legacy
cy.logout()
cy.checkSession()
cy.resetSession()
cy.handleCookieConsent() // Handle cookie consent modal
cy.navigateToJobsPage() // Navigate from dashboard to jobs
```

#### 3.2 Interview Commands
```javascript
cy.startInterview(jobId)
cy.startMockInterview(jobData)
cy.completeInterview()
cy.answerQuestion(answer)
cy.skipQuestion()
cy.requestHint()
cy.checkInterviewStatus()
cy.waitForInterviewReady()
cy.registerUserAccForInterview(name, email, country, phone) // Register candidate
cy.joinAndStartInterview() // Join and start interview flow
cy.getQuestionFromBot(index) // Get question from AI bot
cy.checkInactivityModalAndClickOnResumeBtn() // Handle inactivity modal
cy.textToSpeech(message) // Text to speech for testing
```

#### 3.3 Job Management Commands
```javascript
cy.createJob(jobData)
cy.editJob(jobId, updates)
cy.archiveJob(jobId)
cy.duplicateJob(jobId)
cy.publishJob(jobId)
cy.openFixedJobCreation() // Open fixed questions job creation
cy.fillBasicFixedJobDetails(data) // Fill basic job details
cy.submitCurrentFooterStep(alias) // Submit current step with API intercept
cy.publishCurrentJob() // Publish current job
cy.extractPublishedInterviewLink() // Extract interview link from published job
cy.generateJobDescription() // Generate random job description
```

#### 3.4 Common Action Commands
```javascript
cy.fillForm(formData)
cy.selectOption(selector, value)
cy.uploadFile(selector, filePath)
cy.checkToastMessage(message)
cy.waitForApiCall(endpoint)
cy.waitForElement(selector)
cy.clickButton(buttonText)
cy.verifyUrl(expectedUrl)
cy.setSessionStorage(key, value) // Set session storage
cy.getSessionStorage(key) // Get session storage
cy.checkTextCommand(text) // Check if text is visible
cy.createDynamicJSONFile(filePath, data) // Create JSON file for artifacts
cy.task('logMessage', { message, style }) // Custom logging
```

#### 3.5 API Testing Commands
```javascript
cy.apiRequest(method, endpoint, data)
cy.verifyApiResponse(expected)
cy.checkApiStatusCode(expected)
cy.verifyApiResponseSchema(schema)
cy.requireTalentlyEnv(keys) // Validate required environment variables
```

#### 3.6 Mock Interview Commands (from legacy)
```javascript
cy.verifyStartPracticingForFreeBtn()
cy.verifyBookADemoBtn()
cy.verifymockInterviewJDFieldUnEditable()
cy.verifymockInterviewDurationFieldUnEditable()
cy.verifyCreateMyCustomInterviewBtn()
cy.clickOnMockInterviewSubmitBtn()
cy.clickOnCreateCustomMockInterviewBtn()
cy.clickOnStartMockInterviewBtn()
cy.waitForMockInterviewUpload()
cy.checkValidationOnUserInfoPage()
cy.clickOnStartPracticingForFreeBtn()
cy.clickOnAllRoles()
cy.enterUserDetailsForMockInterview(fName, email)
cy.verifyCustomMockInterviewFields()
cy.selectInterviewTimeMockInterview(time)
cy.createCustomMockInterview(jobTitle, jobDescription, interviewTime)
cy.completeDefaultMockInterviewProcess(companyID)
cy.completeCustomMockInterviewProcess(companyID)
```

### Phase 4: E2E Test Coverage

#### Priority 1 - Critical Paths

**4.1 Authentication Flow**
- Login with valid credentials
- Login with invalid credentials
- Logout functionality
- Session management
- Role-based access control
- Token refresh
- Password reset flow
- Social authentication (if applicable)

**4.2 Regular Interview Flow**
- Navigate to job landing page
- Verify job details display
- Fill user information form
- Submit interview request
- Poll interview status
- Start interview when ready
- Answer interview questions
- Complete interview
- Verify interview completion
- Navigate to results page

**4.3 Mock Interview Flow**
- Navigate to mock interview page
- Fill job information form
- Select interview type
- Fill user information form
- Submit mock interview request
- Wait for job creation
- Start mock interview
- Complete mock interview
- Generate report
- Verify report generation

#### Priority 2 - Important Features

**4.4 Coding Interview Flow**
- Navigate to coding interview
- Display coding questions
- Interact with code editor
- Write code solution
- Submit code
- Verify code evaluation
- View coding results
- Handle compilation errors

**4.5 Job Management**
- Create new job
- Fill job details
- Set job requirements
- Configure interview settings
- Enable/disable coding questions
- Edit existing job
- Archive job
- Duplicate job
- Publish/unpublish job

**4.6 Candidate Management**
- View candidate list
- Filter candidates by status
- Search candidates
- View candidate profile
- Check candidate interview history
- Download candidate resume
- Add candidate notes

#### Priority 3 - Additional Features

**4.7 Dashboard**
- View interview statistics
- Check job listings
- View activity logs
- Verify data accuracy
- Check date filters
- Export reports

**4.8 Settings**
- Company settings
- User profile settings
- Notification preferences
- Security settings
- Integration settings

### Phase 5: API Testing

#### 5.1 Authentication Endpoints
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- POST /auth/forgot-password
- POST /auth/reset-password

#### 5.2 Interview Endpoints
- POST /interview
- GET /interview/{call_id}
- GET /interview/{call_id}/status
- PUT /interview/{call_id}
- DELETE /interview/{call_id}

#### 5.3 Job Management Endpoints
- POST /job
- GET /job/{id}
- PUT /job/{id}
- DELETE /job/{id}
- GET /jobs/list

#### 5.4 Candidate Endpoints
- GET /candidates
- GET /candidates/{id}
- PUT /candidates/{id}
- GET /candidates/{id}/interviews

#### 5.5 Mock Interview Endpoints
- POST /mock-interview
- GET /mock-interview/{id}
- PUT /mock-interview/{id}

#### 5.6 Integration Testing
- Firebase authentication integration
- Twilio video integration
- S3 storage operations
- OpenAI API calls
- WebSocket connections
- SQS message processing

### Phase 6: Advanced Testing

#### 6.1 Visual Regression Testing
- Screenshot comparison
- Cross-browser consistency
- Responsive design validation
- Component-level visual testing
- Layout shift detection

#### 6.2 Performance Testing
- Page load time measurements
- API response time monitoring
- Interview flow performance
- Resource loading optimization
- Memory leak detection

#### 6.3 Accessibility Testing
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast verification
- Alt text validation
- ARIA attributes verification

#### 6.4 Security Testing
- XSS vulnerability testing
- CSRF protection verification
- SQL injection prevention
- Authentication bypass attempts
- Authorization testing
- Data encryption verification

### Phase 7: CI/CD Integration

#### 7.1 GitHub Actions Setup
- Automated test execution on PR
- Scheduled test runs (daily/weekly)
- Parallel test execution
- Matrix strategy for multiple browsers
- Conditional test execution based on changed files

#### 7.2 Test Reporting
- Test result dashboard
- HTML test reports
- Video recording storage
- Screenshot artifacts
- Test coverage reports
- Performance metrics

#### 7.3 Notifications
- Slack notifications for test failures
- Email alerts for critical failures
- JIRA integration for bug tracking
- Test result summaries

#### 7.4 Deployment Pipeline
- Run tests before deployment
- Block deployment on test failure
- Staging environment validation
- Production smoke tests

### Phase 8: Maintenance

#### 8.1 Test Data Management
- Regular fixture updates
- Test data cleanup scripts
- Database seeding automation
- Data versioning
- Test data validation

#### 8.2 Test Documentation
- Test case documentation
- Runbook for manual execution
- Troubleshooting guide
- Onboarding documentation
- Best practices guide

#### 8.3 Test Maintenance
- Regular test review and updates
- Flaky test identification and fixing
- Test refactoring
- Performance optimization
- Deprecation of outdated tests

## Implementation Timeline

### Week 1-2: Foundation
- Cypress configuration
- Project structure setup
- Basic custom commands
- Test data fixtures

### Week 3-4: Critical Paths
- Authentication tests
- Regular interview flow tests
- Mock interview flow tests

### Week 5-6: Additional Features
- Coding interview tests
- Job management tests
- Candidate management tests

### Week 7-8: API & Advanced Testing
- API endpoint tests
- Integration tests
- Visual regression tests

### Week 9-10: CI/CD & Maintenance
- GitHub Actions setup
- Test reporting
- Documentation
- Maintenance procedures

## Success Metrics

- **Test Coverage**: >80% of critical user flows
- **Test Stability**: <5% flaky test rate
- **Execution Time**: <30 minutes for full test suite
- **Bug Detection**: Catch 90% of regressions before production
- **CI/CD Integration**: 100% automated on PR

## Risks and Mitigations

### Risk 1: Test Data Management
**Mitigation**: Implement robust data seeding and cleanup procedures

### Risk 2: Flaky Tests
**Mitigation**: Implement retry logic, proper waits, and test isolation

### Risk 3: External Service Dependencies
**Mitigation**: Mock external services where possible, use test accounts

### Risk 4: Performance Impact
**Mitigation**: Optimize test execution, use parallel testing

### Risk 5: Maintenance Overhead
**Mitigation**: Regular test reviews, documentation, and refactoring

## Next Steps

1. Review and approve this automation plan
2. Set up Cypress configuration (Phase 1)
3. Create test data fixtures (Phase 2)
4. Implement custom commands (Phase 3)
5. Start with critical path tests (Phase 4)

## Reusable Components from Legacy Project

### Directly Reusable Files (with consent)
The following components from the old `test-automation-talently` repository can be adapted:

**Configuration Files:**
- `cypress.config.js` - Environment configuration, browser permissions, custom tasks
- `cypress.env.example.json` - Environment variable template
- `package.json` - Dependencies and scripts

**Support Files:**
- `cypress/support/selectors/selectors.js` - Centralized selector management
- `cypress/support/commands/auth.commands.js` - Authentication commands
- `cypress/support/commands/job.commands.js` - Job management commands
- `cypress/support/commands/env.commands.js` - Environment validation
- `cypress/support/commands/workspace.commands.js` - Workspace commands
- `cypress/support/commands/candidate.commands.js` - Candidate commands

**Command Modules:**
- `cypress/support/companyAuthCommands/companyAuthCommands.js` - Company authentication
- `cypress/support/createJobCommands/createJobWithoutCustomizedQsCommands.js` - Job creation
- `cypress/support/createJobCommands/createJobWithCustomizedQsCommands.js` - Custom questions
- `cypress/support/interviewCommands/interviewCommands.js` - Interview flow commands
- `cypress/support/interviewCommands/dynamicInterviewCommands.js` - Dynamic interviews
- `cypress/support/mockInterviewCommands/mockInterviewCommands.js` - Mock interview commands

**Test Patterns:**
- Test structure from `cypress/e2e/interviewSpec/` - Interview test patterns
- Test structure from `cypress/e2e/mockInterviewSpec/` - Mock interview patterns
- Test structure from `cypress/e2e/createJobSpec/` - Job creation patterns
- API intercept patterns and waiting strategies
- Session storage and cookie handling approaches

### Adaptation Required
These components will need updates to match:
- Current interview-ai UI changes
- New API endpoints
- Updated selectors and locators
- Current authentication flow
- New features and functionality

### Dependencies to Install
```json
{
  "devDependencies": {
    "@faker-js/faker": "^8.3.1",
    "cypress": "^13.5.0",
    "cypress-real-events": "^1.11.0",
    "npm-run-all": "^4.1.5"
  },
  "dependencies": {
    "cypress-browser-permissions": "^1.0.2",
    "socket.io-client": "^4.7.2"
  }
}
```

### Scripts to Include
```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:smoke": "cypress run --spec \"cypress/e2e/smoke/**/*.cy.js\"",
    "cy:regression": "cypress run --spec \"cypress/e2e/regression/**/*.cy.js\"",
    "cy:nightly": "cypress run --spec \"cypress/e2e/nightly/**/*.cy.js\"",
    "interviews:parallel": "npm-run-all --parallel interview1 interview2 interview3"
  }
}
```

## Contact

For questions or updates to this automation plan, contact the QA team or project leads.
