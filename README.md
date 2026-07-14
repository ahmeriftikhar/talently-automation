# Talently Automation

E2E automation testing project using Cypress.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

## Running Tests

### Open Cypress Test Runner (Interactive Mode)
```bash
npm run cypress
```

### Run Tests Headless
```bash
npm run cypress:run
```

### Run Tests in Chrome Browser
```bash
npm run cypress:run:chrome
```

### Run Tests in Firefox Browser
```bash
npm run cypress:run:firefox
```

### Run Tests in Headless Mode
```bash
npm run cypress:run:headless
```

## Project Structure

```
cypress/
├── e2e/              # E2E test files (*.cy.js)
├── component/        # Component test files (*.cy.js)
├── fixtures/         # Test data files
├── support/
│   ├── commands.js   # Custom Cypress commands
│   └── e2e.js        # E2E support file
└── downloads/        # Downloaded files during tests
```

## Configuration

The Cypress configuration is defined in `cypress.config.js`. Key settings:
- **baseUrl**: http://localhost:3000
- **viewportWidth**: 1280px
- **viewportHeight**: 720px
- **defaultCommandTimeout**: 10s
- **requestTimeout**: 10s

## Writing Tests

Create new test files in the `cypress/e2e/` directory with the `.cy.js` extension.

Example test structure:
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should perform action', () => {
    cy.get('selector').should('exist')
    cy.get('selector').click()
    cy.get('result').should('be.visible')
  })
})
```

## Custom Commands

Add custom commands in `cypress/support/commands.js` to reuse common test actions across your tests.

## License

ISC
