import { selectors } from '../selectors/selectors';

Cypress.Commands.add('switchWorkspace', (workspaceName) => {
    cy.get(selectors.workspace.switcher).click();
    cy.get(selectors.workspace.option(workspaceName)).click();
});

Cypress.Commands.add('getCurrentWorkspace', () => {
    return cy.get(selectors.workspace.switcher).invoke('text');
});
