const { defineConfig } = require("cypress");
const { cypressBrowserPermissionsPlugin } = require('cypress-browser-permissions');
const fs = require('fs');

const localEnvPath = process.env.ENVIRONMENT === 'prod'
    ? 'cypress.env.prod.json'
    : 'cypress.env.json';

// const localEnvPath = 'cypress.env.json';
const localEnv = fs.existsSync(localEnvPath)
    ? JSON.parse(fs.readFileSync(localEnvPath, 'utf8'))
    : {};

const envValue = (key, fallback) => {
    const cypressKey = `CYPRESS_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`;
    return process.env[cypressKey] || process.env[key] || localEnv[key] || fallback;
};

const environment = envValue('environment', process.env.ENVIRONMENT || 'dev');
const isProd = environment === 'prod';

const frontendBaseUrl =
    envValue('frontendBaseUrl') ||
    (isProd ? "https://interview.talently.ai/" : "https://develop.d2n5cdf1ckgvym.amplifyapp.com/");

const backendBaseUrl =
    envValue('backendBaseUrl') ||
    (isProd ? "https://api.interview.talently.ai" : "https://dev.interview.talently.ai");

module.exports = defineConfig({
    e2e: {
        baseUrl: frontendBaseUrl,
        baseSecUrl: backendBaseUrl,
        loginUrl: `${frontendBaseUrl.replace(/\/$/, '')}/login`,
        screenshotsFolder: "cypress/failedCasesEvidence",
        screenshotOnRunFailure: true,
        video: true,
        defaultCommandTimeout: 60000,
        viewportWidth: 1280,
        viewportHeight: 720,
        requestTimeout: 10000,
        env: {
            environment,
            frontendBaseUrl,
            backendBaseUrl,
            companyEmail: envValue('companyEmail'),
            companyPassword: envValue('companyPassword'),
            workspaceName: envValue('workspaceName'),
            cleanupMode: envValue('cleanupMode', 'archive'),
        },
        setupNodeEvents(on, config) {
            // Prod/dev env values must win over Cypress's auto-loaded cypress.env.json
            Object.assign(config.env, {
                environment,
                frontendBaseUrl,
                backendBaseUrl,
                companyEmail: envValue('companyEmail'),
                companyPassword: envValue('companyPassword'),
                workspaceName: envValue('workspaceName'),
                cleanupMode: envValue('cleanupMode', 'archive'),
            });
            config = cypressBrowserPermissionsPlugin(on, config);
            on('before:browser:launch', (browser, launchOptions) => {
                // Check if the browser is Chromium (such as Chrome or Edge)
                if (browser.family === 'chromium') {
                    // Modify the launch options to enable camera and microphone permissions
                    launchOptions.args.push('--use-fake-ui-for-media-stream');
                }
                return launchOptions;
            });

            // Handle browser permissions
            on('before:browser:launch', (browser, launchOptions) => {
                if (browser.family === 'chromium') {
                    const browserPermissions = {
                        notifications: 'allow',
                        geolocation: 'allow',
                        camera: 'allow',
                        microphone: 'allow',
                        images: 'allow',
                        javascript: 'allow',
                        popups: 'ask',
                        plugins: 'ask',
                        cookies: 'allow'
                    };

                    // Set browser permissions based on the specified config
                    const args = launchOptions.args || [];
                    args.push(`--permissions=${JSON.stringify(browserPermissions)}`);
                    launchOptions.args = args;
                }
                return launchOptions;
            });

            // Custom task for colored console logging
            on('task', {
                logMessage({ message, style }) {
                    // Define ANSI color codes
                    const ANSI_COLORS = {
                        reset: '\x1b[0m',
                        green: '\x1b[32m',
                        blue: '\x1b[34m',
                        gray: '\x1b[90m',
                        yellow: '\x1b[33m',
                    };

                    // Log the styled message in the terminal
                    console.log(`${ANSI_COLORS[style]}${message}${ANSI_COLORS.reset}`);
                    return null;
                },
            });

            return config;
        },
    },
});
