import { selectors } from '../selectors/selectors';

// Switch the active workspace via the HeaderAvatar dropdown (top-right on authenticated pages).
// If the target workspace is already active (its menu item is disabled), this is a no-op.
Cypress.Commands.add('switchWorkspace', (workspaceName) => {
    cy.task('logMessage', { message: `Switching workspace to "${workspaceName}"`, style: 'blue' });
    cy.get(selectors.workspace.switcherTrigger, { timeout: 15000 }).first().click();

    // The workspaces list loads asynchronously into the menu, so wait (retryably) for the target
    // workspace item to appear rather than snapshotting the menu once.
    cy.contains(selectors.workspace.menuItem, workspaceName, { timeout: 20000 }).then(($item) => {
        const alreadyActive =
            $item.is('[data-disabled]') || $item.attr('aria-disabled') === 'true' || $item.prop('disabled');
        if (alreadyActive) {
            cy.task('logMessage', { message: `Already on workspace "${workspaceName}"`, style: 'gray' });
            cy.get('body').type('{esc}'); // close the dropdown
        } else {
            cy.wrap($item).click();
            cy.task('logMessage', { message: `Switched to workspace "${workspaceName}"`, style: 'green' });
        }
    });
});
