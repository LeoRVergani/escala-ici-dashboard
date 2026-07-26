import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/lib/parser/fixtures');

async function openLocalDevAccess(page: Page) {
  await page.getByRole('button', { name: /Acessar ambiente de teste/ }).click();
  await page.getByText('Entrar no ambiente local').click();
}

async function loginAndOpenSocEditor(page: Page) {
  await page.goto('/login');
  await openLocalDevAccess(page);
  await page.waitForURL('**/setores');
  await page.getByText('Abrir setor').click();
  await page.waitForURL('**/equipes');
  const socCard = page.locator('[data-team-id]').filter({ hasText: 'SOC' }).first();
  await socCard.getByText('Abrir equipe').click();
  await page.waitForURL('**/escalas');
  await page.getByText('Criar agora').click();
  await page.waitForURL('**/escalas/nova**');
  await page.getByText('Criar agora').click();
  await page.waitForURL(/\/escalas\/[a-f0-9-]+$/);
}

async function openSocSchedulesPage(page: Page) {
  await page.goto('/login');
  await openLocalDevAccess(page);
  await page.waitForURL('**/setores');
  await page.getByText('Abrir setor').click();
  await page.waitForURL('**/equipes');
  const socCard = page.locator('[data-team-id]').filter({ hasText: 'SOC' }).first();
  await socCard.getByText('Abrir equipe').click();
  await page.waitForURL('**/escalas');
}

async function addMember(page: Page, name: string, login: string) {
  await page.getByRole('button', { name: 'Mais ações ▾' }).click();
  await page.getByRole('menuitem', { name: 'Adicionar colaborador' }).click();
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('Login corporativo').fill(login);
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
}

test.describe('Escala ICI — checkpoint 1 end-to-end flow', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('login local signs in without any Microsoft/MSAL simulation', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Entrar com Microsoft').click();
    await expect(
      page.getByText('A integração Microsoft ainda não está configurada neste ambiente local.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await openLocalDevAccess(page);
    await expect(page).toHaveURL(/\/setores$/);
  });

  test('sector selection shows COSI, team selection is filtered by sectorId', async ({ page }) => {
    await page.goto('/login');
    await openLocalDevAccess(page);
    await page.waitForURL('**/setores');
    await expect(page.getByText('COSI', { exact: true })).toBeVisible();

    await page.getByText('Abrir setor').click();
    await page.waitForURL('**/equipes');
    await expect(page.getByText('SOC', { exact: true })).toBeVisible();
    await expect(page.getByText('NOC', { exact: true })).toBeVisible();
    await expect(page.getByText('Plantão COSI', { exact: true })).toBeVisible();
  });

  test('header always shows the selected sector/team (COSI / SOC)', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await expect(page.locator('header').getByText('COSI / SOC', { exact: true })).toBeVisible();
  });

  test('creating an empty SOC schedule lands directly in the editor', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await expect(page.locator('table[role="grid"]')).toHaveCount(0); // no members yet
    await addMember(page, 'Ana Souza', 'ana.souza');
    await expect(page.locator('table[role="grid"]')).toBeVisible();
  });

  test('clicking a cell opens a menu at the click point, never clipped by the grid', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');

    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const menu = page.getByTestId('cell-menu');
    await expect(menu).toBeVisible();
    const menuBox = (await menu.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height);
  });

  test('Escape closes the cell menu', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId('cell-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('cell-menu')).not.toBeVisible();
  });

  test('clicking outside the cell menu closes it', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId('cell-menu')).toBeVisible();
    await page.mouse.click(20, 20);
    await expect(page.getByTestId('cell-menu')).not.toBeVisible();
  });

  test('choosing a shift in the menu changes the cell', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.getByRole('menuitem', { name: 'M', exact: true }).click();
    await expect(cell.getByText('M', { exact: true })).toBeVisible();
  });

  test('drag-and-drop moves an assignment between days in the same row', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');

    const sourceCell = page.locator('td[data-member-id][data-date]').nth(0);
    const targetCell = page.locator('td[data-member-id][data-date]').nth(2);
    const sourceBox = (await sourceCell.boundingBox())!;

    await page.mouse.click(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.getByRole('menuitem', { name: 'T', exact: true }).click();
    await expect(sourceCell.getByText('T', { exact: true })).toBeVisible();

    const targetBox = (await targetCell.boundingBox())!;
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 15, sourceBox.y + sourceBox.height / 2, { steps: 3 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
    await page.mouse.up();

    await expect(targetCell.getByText('T', { exact: true })).toBeVisible();
    await expect(sourceCell.getByText('T', { exact: true })).toHaveCount(0);
  });

  test('an invalid drop (released outside the grid) leaves data unchanged', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');

    const sourceCell = page.locator('td[data-member-id][data-date]').nth(0);
    const sourceBox = (await sourceCell.boundingBox())!;
    await page.mouse.click(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.getByRole('menuitem', { name: 'N', exact: true }).click();
    await expect(sourceCell.getByText('N', { exact: true })).toBeVisible();

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 15, sourceBox.y + sourceBox.height / 2, { steps: 3 });
    // Release far above the grid, over the page header — not a valid grid cell.
    await page.mouse.move(20, 20, { steps: 5 });
    await page.mouse.up();

    // Source keeps its original value; nothing was silently cleared or duplicated.
    await expect(sourceCell.getByText('N', { exact: true })).toBeVisible();
  });

  test('undo restores the grid after a change, via the toolbar button', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.getByRole('menuitem', { name: 'M', exact: true }).click();
    await expect(cell.getByText('M', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(cell.getByText('M', { exact: true })).toHaveCount(0);
  });

  test('publishing locally shows the local-publication disclaimer, never a fake remote success', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.getByRole('menuitem', { name: 'M', exact: true }).click();

    await page.getByText('Continuar para publicação').click();
    await expect(page.getByText('Nenhum erro impeditivo')).toBeVisible();
    await page.getByText('Publicar escala').click();
    await page.getByText('Confirmar').click();

    await expect(page.getByText(/Publicação local de desenvolvimento/)).toBeVisible();
    await expect(page.getByText(/Escala .* publicada/)).toBeVisible();
  });

  test('importing a real XLSX file extracts collaborators and assignments into the editor', async ({ page }) => {
    await openSocSchedulesPage(page);
    await page.getByText('Importar arquivo').click();
    await page.waitForURL('**/escalas/nova**');

    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURE_DIR, 'soc-controle-julho-ficticio.xlsx'),
    );
    await page.waitForURL(/\/escalas\/[a-f0-9-]+$/, { timeout: 15_000 });

    await expect(page.locator('table[role="grid"]')).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
    // At least one imported cell carries a real shift, not just empty placeholders.
    await expect(page.locator('td[data-member-id][data-date] button:not(:text("—"))').first()).toBeVisible();
  });

  test('a draft schedule survives a page reload (scenarios: salvar rascunho / reabrir rascunho)', async ({ page }) => {
    await loginAndOpenSocEditor(page);
    await addMember(page, 'Ana Souza', 'ana.souza');
    const cell = page.locator('td[data-member-id][data-date]').first();
    const box = (await cell.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.getByRole('menuitem', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(/Salvo automaticamente/)).toBeVisible();

    const scheduleUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(scheduleUrl);
    await expect(page.getByText('Ana Souza')).toBeVisible();
    await expect(page.locator('td[data-member-id][data-date]').first().getByText('M', { exact: true })).toBeVisible();

    // It must also show up as "Continuar rascunho" from the team's schedules page.
    await page.getByLabel('Ir para minhas equipes').click();
    await page.waitForURL('**/setores');
    await page.getByText('Abrir setor').click();
    await page.waitForURL('**/equipes');
    const socCard = page.locator('[data-team-id]').filter({ hasText: 'SOC' }).first();
    await socCard.getByText('Abrir equipe').click();
    await page.waitForURL('**/escalas');
    await expect(page.getByText('Continuar rascunho')).toBeVisible();
    await page.getByText('Continuar rascunho').click();
    await expect(page).toHaveURL(scheduleUrl);
    await expect(page.getByText('Ana Souza')).toBeVisible();
  });
});
