import { expect, test } from '@playwright/test';

async function signInAs(page, role) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Demo accounts' }).click();
  await page.getByRole('button', { name: `Continue as ${role}` }).click();
}

test('admin events, staff RSVP, and FDE clients render with demo accounts', async ({ page }) => {
  await signInAs(page, 'Admin');
  await page.goto('/admin/events');
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create event' })).toBeVisible();

  await signInAs(page, 'Staff');
  await page.goto('/staff/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.getByRole('link', { name: 'View details' }).first().click();
  await expect(page.getByRole('heading', { name: 'RSVP' })).toBeVisible();

  await signInAs(page, 'FDE');
  await page.goto('/fde');
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Northwind Offices' })).toBeVisible();
});
