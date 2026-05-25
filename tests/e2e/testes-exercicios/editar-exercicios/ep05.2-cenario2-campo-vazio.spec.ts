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

    // Busca o exercício específico do Cenário 2
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base Cenario 2');
    await page.waitForTimeout(1000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  test('Cenário 2: Edição com campo obrigatório vazio', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // Checando com o dado pré-preenchido
    await expect(inputNome).toHaveValue('Exercicio Base Cenario 2');
    
    // Limpa o campo obrigatório para forçar o erro
    await inputNome.fill('');
    await btnSalvar.click();

    //! Sistema deveria exibir mensagem de erro mas não a faz, porém também não permite salvar
    await expect(page.getByText(/campo obrigatório/i)).toBeVisible();
    await expect(btnSalvar).toBeVisible();
  });
});