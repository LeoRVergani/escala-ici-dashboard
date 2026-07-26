import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'escala-ici-dashboard-visual-review',
  'organizations-rework',
);

const SIZES = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 },
];

async function loginToOrganizations(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Acessar ambiente de teste/ }).click();
  await page.getByText('Entrar no ambiente local').click();
  await page.waitForURL('**/organizacoes');
  await page.waitForLoadState('networkidle');
}

test.describe('Organizations screen — visual capture (checkpoint 1B)', () => {
  for (const size of SIZES) {
    test(`captures /organizacoes at ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await loginToOrganizations(page);
      await page.screenshot({ path: path.join(OUT_DIR, size.name, 'organizations.png'), fullPage: true });
    });
  }

  test('captures the Criar organização dialog', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginToOrganizations(page);
    await page.getByText('Criar organização').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, 'create-dialog.png') });
  });

  test('captures the authenticated user menu open', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginToOrganizations(page);
    await page.getByRole('button', { name: /Claudio/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Sair' })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, 'user-menu.png') });
  });

  test('captures the mobile sidebar drawer open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginToOrganizations(page);
    await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
    await expect(page.getByRole('dialog', { name: 'Navegação' })).toBeVisible();
    await page.screenshot({ path: path.join(OUT_DIR, '390x844', 'mobile-sidebar.png') });
  });

  test('mobile viewport has no horizontal scroll on /organizacoes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginToOrganizations(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
