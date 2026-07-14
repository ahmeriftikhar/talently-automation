Cypress.Commands.add('requireTalentlyEnv', (keys) => {
    const missingKeys = keys.filter(key => {
        const value = Cypress.env(key);
        return value === undefined || value === null || value === '';
    });

    if (missingKeys.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingKeys.join(', ')}. ` +
            `Please set them in cypress.env.json or as CYPRESS_* environment variables.`
        );
    }

    cy.log(`All required environment variables present: ${keys.join(', ')}`);
});

Cypress.Commands.add('logEnvironmentInfo', () => {
    const environment = Cypress.env('environment');
    const frontendBaseUrl = Cypress.env('frontendBaseUrl');
    const backendBaseUrl = Cypress.env('backendBaseUrl');

    cy.task('logMessage', {
        message: `Environment: ${environment}`,
        style: 'blue',
    });
    cy.task('logMessage', {
        message: `Frontend URL: ${frontendBaseUrl}`,
        style: 'gray',
    });
    cy.task('logMessage', {
        message: `Backend URL: ${backendBaseUrl}`,
        style: 'gray',
    });
});
