// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Session Storage Commands
Cypress.Commands.add('setSessionStorage', (key, value) => {
    cy.window().then((win) => {
        win.sessionStorage.setItem(key, value);
    });
});

Cypress.Commands.add('getSessionStorage', (key) => {
    return cy.window().then((win) => {
        return win.sessionStorage.getItem(key);
    });
});

// Text Verification Command
Cypress.Commands.add('checkTextCommand', (text) => {
    cy.contains(text).should('be.visible');
});

// Dynamic JSON File Creation
Cypress.Commands.add('createDynamicJSONFile', (filePath, data) => {
    const filepath = filePath;
    cy.writeFile(filepath, data);
    cy.log(`Created JSON file: ${filepath}`);
    cy.task('logMessage', {
        message: `Created JSON file: ${filepath}.....`,
        style: 'green',
    });
    cy.exec(`chmod 777 ${filepath}`);
    cy.task('logMessage', {
        message: `Permission to the file granted.....`,
        style: 'green',
    });

    // Check if the file exists with a 10-second timeout
    cy.readFile(filepath, { timeout: 10000 })
        .then(() => {
            cy.log(`File ${filepath} created successfully.`);
            cy.task('logMessage', {
                message: `File ${filepath} created successfully.`,
                style: 'green',
            });
        });
    const destinationDir = 'cypress/fixtures/interviewReports';
    // Define destination file path for artifact upload
    const destinationFilePath = `${destinationDir}/interviewReport_${new Date().toISOString().replace(/:/g, '-')}.json`;
    // Upload the file as an artifact
    cy.exec(`mkdir -p ${destinationDir} && cp ${filePath} ${destinationFilePath}`);
    cy.log(`Uploaded JSON file as artifact: ${destinationFilePath}`);
    cy.task('logMessage', {
        message: `Uploaded JSON file as artifact: ${filePath}`,
        style: 'green',
    });
});

// Job Description Generation
Cypress.Commands.add('generateJobDescription', () => {
    const jobTitles = ['SQA Automation Engineer', 'Software Tester', 'Quality Assurance Engineer'];
    const responsibilities = [
        'Design, develop, and execute automated test scripts to ensure software quality.',
        'Collaborate with cross-functional teams to understand project requirements.',
        'Identify and report software defects, providing detailed information for resolution.',
    ];
    const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
    const description = `
        We are seeking a talented and motivated individual to join our team as a ${randomElement(jobTitles)}. The ideal candidate will play a crucial role in ensuring the quality of our software products through the design and implementation of automated testing solutions. And he can ${randomElement(responsibilities)}
    `;
    return description.trim();
});