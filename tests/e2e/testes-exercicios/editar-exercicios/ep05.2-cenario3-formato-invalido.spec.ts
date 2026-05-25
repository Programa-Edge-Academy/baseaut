import { expect, test } from '@playwright/test';

test.describe('US05.02: Editar Exercício', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081'); 
    
    // Efetua o login
    await page.getByPlaceholder('E-mail').fill('pedro.neves@edge.ufal.br'); 
    await page.getByPlaceholder('Senha').fill('Teste123!');
    await page.getByText('Entrar', {exact: true}).click();

    // Navega até atividades
    await page.getByText('Atividades', {exact: true}).click();
    await page.waitForTimeout(2000);

    // Busca o exercício específico do Cenário 3
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base Cenario 3');
    await page.waitForTimeout(1000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  test('Cenário 3: Edição com formato inválido (excesso de caracteres)', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // Checando com o dado pré-preenchido
    await expect(inputNome).toHaveValue('Exercicio Base Cenario 3');
    
    // Gera uma string de 1141 caracteres para forçar o limite
    const nomeGigante = 'A'.repeat(1141);
    await inputNome.fill(nomeGigante);
    await btnSalvar.click();

    // ! Sistema deveria barrar a ação devido ao limite de caracteres e exibir erro, mas aceita salvar.
    await expect(page.getByText(/limite de caracteres/i)).toBeVisible();
    await expect(btnSalvar).toBeVisible();
  });
});