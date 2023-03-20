import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('Server validation is reflected in client', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').click();
  await page.getByLabel('Email').click();
  await expect(page.locator('p#name-error')).toHaveCount(0);
  await page.getByLabel('Age').click();
  await expect(page.locator('p#email-error')).toHaveCount(0);
  await expect(page.locator('p#age-error')).toHaveCount(0);

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('p#name-error')).toHaveText(
    'String must contain at least 2 character(s), Name must start with A'
  );
  await expect(page.locator('p#email-error')).toHaveText('Invalid email');
  await expect(page.locator('p#age-error')).toHaveText('Required');
});

test('Allowed fields are reflected back to client input', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Name').fill('Foobar');
  await page.getByLabel('Email').fill('foo@bar.com');
  await page.getByLabel('Age').fill('22');

  await page.getByRole('button', { name: 'Submit' }).click();

  expect(page.getByLabel('Name')).toHaveValue('Foobar');
  await expect(page.locator('p#name-error')).toHaveText('Name must start with A');
  expect(page.getByLabel('Email')).toHaveValue('');
  await expect(page.locator('p#email-error')).toHaveCount(0);
  expect(page.getByLabel('Age')).toHaveValue('22');
  await expect(page.locator('p#age-error')).toHaveCount(0);
});

test('Server custom field error is reflected in client', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Name').fill('Ace');
  await page.getByLabel('Email').fill('foo@bar.spam');
  await page.getByLabel('Age').fill('22');

  await page.getByRole('button', { name: 'Submit' }).click();

  expect(page.getByLabel('Name')).toHaveValue('Ace');
  await expect(page.locator('p#name-error')).toHaveCount(0);
  expect(page.getByLabel('Email')).toHaveValue('');
  await expect(page.locator('p#email-error')).toHaveText('Email cannot contain spam.');
  expect(page.getByLabel('Age')).toHaveValue('22');
  await expect(page.locator('p#age-error')).toHaveCount(0);
});

test('On successful submit, input values are not reflected', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').fill('Ace');
  await page.getByLabel('Email').fill('foo@bar.com');
  await page.getByLabel('Age').fill('22');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('p#name-error')).toHaveCount(0);
  await expect(page.locator('p#email-error')).toHaveCount(0);
  await expect(page.locator('p#age-error')).toHaveCount(0);
  await expect(page.locator('p')).toHaveText('User Ace created with age 22');

  await expect(page.getByLabel('Name')).toBeEmpty();
  await expect(page.getByLabel('Email')).toBeEmpty();
  await expect(page.getByLabel('Age')).toBeEmpty();
});
