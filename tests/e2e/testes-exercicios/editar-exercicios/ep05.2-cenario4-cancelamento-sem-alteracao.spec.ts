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

    // Busca o exercício específico do Cenário 4
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base Cenario 4');
    await page.waitForTimeout(1000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  test('Cenário 4: Cancelamento sem alteração de dados', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnCancelar = page.locator('div').filter({ hasText: /^Cancelar$/ }).first();
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // Checando com o dado pré-preenchido para garantir que a tela carregou
    await expect(inputNome).toHaveValue('Exercicio Base Cenario 4');
    
    // Clica em Cancelar sem fazer nenhuma alteração
    await btnCancelar.click();

    // Direcionado para a aba de ativadades novamente
    await expect(page.getByPlaceholder('Buscar por nome...')).toBeVisible();
    await expect(btnSalvar).toBeHidden();
  });
});