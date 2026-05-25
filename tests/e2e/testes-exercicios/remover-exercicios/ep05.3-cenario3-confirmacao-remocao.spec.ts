import { expect, test } from '@playwright/test';

test.describe('US05.03: Remover Exercício', () => {
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
    await inputBusca.fill('Exercicio Base US05.3 Cenario 3');
    await page.waitForTimeout(1000);

    // Abre a caixa de opções do card
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.waitForTimeout(1000);
  });

  test('Cenário 3: Confirmação da remoção', async ({ page }) => {
    
    // Aciona a opção "Excluir" 
    const btnExcluirMenu = page.locator('div').filter({ hasText: /^Excluir$/ }).first();
    await btnExcluirMenu.click();

    // Clica em "Excluir"
    const btnConfirmar = page.locator('div').filter({ hasText: /^Excluir$/ }).nth(1);
    await btnConfirmar.click();

    await page.waitForTimeout(2000);

    // Para validar isso, limpamos a busca, buscamos de novo e garantimos que o card NÃO está lá
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('');
    await inputBusca.fill('Exercicio Base US05.3 Cenario 3');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Exercicio Base US05.3 Cenario 3')).not.toBeVisible();
  });
});