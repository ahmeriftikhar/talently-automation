import { selectors } from '../selectors/selectors';

// Switch the active workspace via the HeaderAvatar dropdown (top-right on authenticated pages).
//
// The workspaces list loads asynchronously (GET /workspaces/). If the dropdown is opened while the
// page is still loading, the menu shows an empty list — and a Radix menu opened in that window does
// not reliably re-populate while it stays open. So we:
//   1. wait for the page to finish loading (document.readyState === 'complete') and the switcher to render,
//   2. open the dropdown; if the target workspace isn't listed yet, CLOSE and RE-OPEN (which re-reads
//      the freshly-loaded list) a few times before giving up.
// NON-FATAL: if the workspace never appears (e.g. the account genuinely has no such workspace), it
// logs a clear warning and continues rather than failing the whole suite.
Cypress.Commands.add('switchWorkspace', (workspaceName) => {
    if (!workspaceName) return;
    cy.task('logMessage', { message: `Attempting to switch workspace to "${workspaceName}"`, style: 'blue' });

    // 1) Wait for the page to be fully loaded before interacting.
    cy.document({ timeout: 30000 }).its('readyState').should('eq', 'complete');
    cy.get(selectors.workspace.switcherTrigger, { timeout: 30000 }).should('be.visible');

    // 2) Open (and re-open) the switcher until the target workspace appears.
    const tryOpenAndSwitch = (attempt) => {
        cy.get(selectors.workspace.switcherTrigger).first().click();

        cy.get('body').then(($b) => {
            const items = [...$b.find(selectors.workspace.menuItem)];
            const target = items.find((el) => (el.textContent || '').includes(workspaceName));

            if (target) {
                const alreadyActive =
                    target.getAttribute('aria-disabled') === 'true' ||
                    target.hasAttribute('data-disabled') ||
                    target.disabled;
                if (alreadyActive) {
                    cy.task('logMessage', { message: `Already on workspace "${workspaceName}"`, style: 'gray' });
                    cy.get('body').type('{esc}');
                } else {
                    cy.wrap(target).click();
                    cy.task('logMessage', { message: `Switched to workspace "${workspaceName}"`, style: 'green' });
                }
                return;
            }

            // Not listed yet — the workspaces fetch may still be in flight. Close, wait, re-open.
            if (attempt < 5) {
                cy.task('logMessage', {
                    message: `Workspace "${workspaceName}" not listed yet — reopening switcher (attempt ${attempt + 1}/5)`,
                    style: 'yellow',
                });
                cy.get('body').type('{esc}');
                cy.wait(2000); // poll interval: give the workspaces list time to load
                tryOpenAndSwitch(attempt + 1);
            } else {
                const labels = items.map((el) => `"${(el.textContent || '').trim()}"`).join(', ');
                cy.task('logMessage', {
                    message: `Workspace "${workspaceName}" not found after retries (menu: [${labels}]) — skipping switch`,
                    style: 'yellow',
                });
                cy.get('body').type('{esc}');
            }
        });
    };

    tryOpenAndSwitch(0);
});

// Read the current workspace name from the switcher trigger (best-effort).
Cypress.Commands.add('getCurrentWorkspace', () => {
    return cy.get(selectors.workspace.switcherTrigger).first().invoke('text');
});
