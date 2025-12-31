import { test, expect } from '@playwright/test';

test.describe('Kanban Page', () => {
  test('loads /kanban and shows columns and cards', async ({ page }) => {
    await page.goto('/kanban');

    // Expect page title or header
    await expect(page.getByText('Website Redesign Project')).toBeVisible();

    // Columns visible
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();

    // A few known cards
    await expect(page.getByText('Design Homepage')).toBeVisible();
    await expect(page.getByText('Setup Hosting')).toBeVisible();
  });
});


