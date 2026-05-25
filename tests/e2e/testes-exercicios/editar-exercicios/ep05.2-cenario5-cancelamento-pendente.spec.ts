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

    // Busca o exercício específico do Cenário 5
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base Cenario 5');
    await page.waitForTimeout(1000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  test('Cenário 5: Cancelamento com alterações pendentes', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnCancelar = page.locator('div').filter({ hasText: /^Cancelar$/ }).first();

    // Checando com o dado pré-preenchido
    await expect(inputNome).toHaveValue('Exercicio Base Cenario 5');
    
    // Altera um dado
    await inputNome.fill('Exercicio Base Cenario 5 - Com alteracao nao salva');

    //! O sistema deveria exibir aviso de "alterações não salvas" e solicitar confirmação antes de descartar as alterações, porém ele apenas descarta as alterações até então e cancela tudo.
    await btnCancelar.click();
    await expect(page.getByText(/alterações não salvas/i).first()).toBeVisible();
  });
});