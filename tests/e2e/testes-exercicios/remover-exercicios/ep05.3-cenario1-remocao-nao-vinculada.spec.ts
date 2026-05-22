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

    // Busca o exercício específico do Cenário 1
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base US05.3 Cenario 1');
    await page.waitForTimeout(1000);

    // Abre a caixa de opções do card
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.waitForTimeout(1000);
  });

  test('Cenário 1: Remoção de exercício não vinculado a circuitos', async ({ page }) => {
    
    // Aciona a opção "Excluir"
    const btnExcluir = page.locator('div').filter({ hasText: /^Excluir$/ }).first();
    await btnExcluir.click();

    // O sistema deve exibir a mensagem de confirmação informando que a ação é irreversível
    const avisoIrreversivel = page.getByText(/esta ação não pode ser desfeita/i);
    await expect(avisoIrreversivel).toBeVisible();

    const btnConfirmar = page.locator('div').filter({ hasText: /^Excluir$/ }).nth(1);
    const btnCancelar = page.locator('div').filter({ hasText: /^Cancelar$/ }).first();
    await expect(btnConfirmar).toBeVisible();
    await expect(btnCancelar).toBeVisible();
  });
});