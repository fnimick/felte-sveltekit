import { expect, test } from '@playwright/test';

test('Form inputs validate on submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('p#name-error')).toHaveText(
    'String must contain at least 2 character(s), Name must start with A'
  );
  await expect(page.locator('p#email-error')).toHaveText('Invalid email');
  await expect(page.locator('p#age-error')).toHaveText('Required');
});

test('Form inputs validate on blur, revalidate on type', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').focus();
  await page.getByLabel('Email').focus();
  await expect(page.locator('p#name-error')).toHaveText(
    'String must contain at least 2 character(s), Name must start with A'
  );
  await page.getByLabel('Age').focus();
  await expect(page.locator('p#email-error')).toHaveText('Invalid email');
  await page.getByLabel('Name').focus();
  await expect(page.locator('p#age-error')).toHaveText('Required');

  // Input revalidates on type without blur
  await page.getByLabel('Name').fill('Foobar');
  await expect(page.locator('p#name-error')).toHaveText('Name must start with A');
  await page.getByLabel('Name').fill('');
  await expect(page.locator('p#name-error')).toHaveText(
    'String must contain at least 2 character(s), Name must start with A'
  );

  await page.getByLabel('Name').fill('Ace');
  await expect(page.locator('p#name-error')).toHaveCount(0);
  await page.getByLabel('Email').fill('foo@bar.spam');
  await expect(page.locator('p#email-error')).toHaveCount(0);
  await page.getByLabel('Age').fill('22');
  await expect(page.locator('p#age-error')).toHaveCount(0);
});

test('Server applies error to form input on targeted failure', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').fill('Ace');
  await expect(page.locator('p#name-error')).toHaveCount(0);
  await page.getByLabel('Email').fill('foo@bar.spam');
  await expect(page.locator('p#email-error')).toHaveCount(0);
  await page.getByLabel('Age').fill('22');
  await expect(page.locator('p#age-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('p#email-error')).toHaveText('Email cannot contain spam.');
});

test('On successful submit, form is not reset', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').fill('Ace');
  await page.getByLabel('Email').fill('foo@bar.com');
  await page.getByLabel('Age').fill('22');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('p#name-error')).toHaveCount(0);
  await expect(page.locator('p#email-error')).toHaveCount(0);
  await expect(page.locator('p#age-error')).toHaveCount(0);
  await expect(page.locator('p')).toHaveText('User Ace created with age 22');

  expect(page.getByLabel('Name')).toHaveValue('Ace');
  expect(page.getByLabel('Email')).toHaveValue('foo@bar.com');
  expect(page.getByLabel('Age')).toHaveValue('22');
});
