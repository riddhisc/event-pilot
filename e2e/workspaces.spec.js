import { expect, test } from '@playwright/test';

test('admin events, staff RSVP, and FDE clients render without login', async ({ page }) => {
  await page.goto('/admin/events');
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create event' })).toBeVisible();

  await page.goto('/staff/dashboard');
  await expect(page.getByRole('heading', { name: 'Staff dashboard' })).toBeVisible();
  await page.getByRole('link', { name: 'View details' }).first().click();
  await expect(page.getByRole('heading', { name: 'RSVP' })).toBeVisible();

  await page.goto('/fde');
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Northwind Offices' })).toBeVisible();
});
